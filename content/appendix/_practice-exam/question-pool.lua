local slot_marks = {
  ["a-estimator"] = 10,
  ["a-likelihood"] = 10,
  ["a-interval"] = 10,
  ["a-testing"] = 10,
  ["a-bayes"] = 10,
  ["b-estimation"] = 20,
  ["b-bayes"] = 20,
  ["b-testing"] = 20,
}

local function add_part_marks(prompt, values, total, id)
  local marks = {}
  local sum = 0
  for value in values:gmatch("%S+") do
    local mark = tonumber(value)
    assert(mark and mark > 0 and mark % 1 == 0, id .. ": invalid part marks")
    marks[#marks + 1] = mark
    sum = sum + mark
  end
  assert(sum == total, id .. ": part marks must add to " .. total)

  local parts
  for _, block in ipairs(prompt) do
    if block.t == "OrderedList" then
      assert(not parts, id .. ": expected one top-level list of question parts")
      parts = block.content
    end
  end
  assert(parts and #parts == #marks, id .. ": list and part marks must have the same length")

  for index, blocks in ipairs(parts) do
    local mark = marks[index]
    local label = string.format("[%d %s]", mark, mark == 1 and "mark" or "marks")
    local span = pandoc.Span(pandoc.Str(label), pandoc.Attr("", {"exam-part-marks"}))
    local last = blocks[#blocks]
    if last and (last.t == "Para" or last.t == "Plain") then
      last.content:insert(pandoc.Space())
      last.content:insert(span)
    else
      blocks:insert(pandoc.Plain(span))
    end
  end
end

local function bank_solution(question, id)
  local blocks = pandoc.List()
  local in_details, in_solution = false, false
  for _, block in ipairs(question.content) do
    local html = block.t == "RawBlock" and block.format == "html" and block.text
    if html == '<details class="solution">' then
      assert(not in_details and #blocks == 0, id .. ": expected one bank solution")
      in_details = true
    elseif in_details and html == "</summary>" then
      in_solution = true
    elseif in_details and html == "</details>" then
      in_details, in_solution = false, false
    elseif in_solution then
      blocks:insert(block)
    end
  end
  assert(not in_details and #blocks > 0, id .. ": missing worked bank solution")
  return pandoc.Div(blocks, pandoc.Attr("", {"exam-source-solution"}, {["data-question-id"] = id}))
end

local function bank_question(question)
  local attributes = question.attributes
  local slot = attributes["data-exam-slot"]
  local marks = tonumber(attributes["data-exam-marks"])

  local number, prompt
  for _, block in ipairs(question.content) do
    if block.t == "Header" then
      number = pandoc.utils.stringify(block):match("^Question (%d+):")
    elseif block.t == "Div" and block.classes:includes("exam-prompt") then
      assert(not prompt, "Question " .. (number or "?") .. ": expected one exam-prompt block")
      prompt = block
    end
  end
  assert(number and prompt and #prompt.content > 0, "Missing numbered title or exam-prompt")
  -- Prefer the existing anchor. A prompt anchor leaves unnumbered callouts unnumbered.
  local id = question.identifier ~= "" and question.identifier or prompt.identifier
  assert(id ~= "", "Question " .. number .. " needs a stable question bank ID")
  assert(marks and slot_marks[slot] == marks, id .. ": invalid exam slot or marks")

  local part_marks = attributes["data-exam-parts"]
  if part_marks then add_part_marks(prompt.content, part_marks, marks, id) end

  local exam_attributes = {
    ["data-slot"] = slot,
    ["data-marks"] = tostring(marks),
    ["data-source"] = "Question Bank, Question " .. number,
    ["data-bank-id"] = id,
    ["data-family"] = attributes["data-exam-family"],
    ["data-exam-origin"] = attributes["data-exam-origin"],
  }
  local exam_id = "bank-question-" .. number
  local exam_prompt = pandoc.Div(prompt.content, pandoc.Attr(exam_id, {"exam-source"}, exam_attributes))
  return exam_prompt, bank_solution(question, exam_id)
end

local function append_bank_questions(pool)
  local appendix = pandoc.path.join({quarto.project.directory, "content", "appendix"})
  local bank_directory = pandoc.path.join({appendix, "_question-bank"})
  local filenames = pandoc.system.list_directory(bank_directory)
  table.sort(filenames)

  local function read_questions(path)
    local file = assert(io.open(path, "r"))
    local source = file:read("*a")
    file:close()
    -- Reuse the marked questions and worked answers without running the bank's code cells.
    pandoc.read(source, "markdown"):walk({
      Div = function(div)
        if div.classes:includes("question") and div.attributes["data-exam-slot"] then
          local prompt, solution = bank_question(div)
          pool.content:insert(prompt)
          pool.content:insert(solution)
        end
      end,
    })
  end

  read_questions(pandoc.path.join({appendix, "question-bank.qmd"}))
  for _, filename in ipairs(filenames) do
    if filename:match("%.qmd$") then
      read_questions(pandoc.path.join({bank_directory, filename}))
    end
  end
end

local function validate_pool(pool)
  local ids = {}
  local solutions = {}
  local slots = {}
  local has_specimen, has_other_bank_question = false, false
  for _, question in ipairs(pool.content) do
    if question.t == "Div" and question.classes:includes("exam-source") then
      local id, attributes = question.identifier, question.attributes
      local slot = attributes["data-slot"]
      assert(id ~= "" and not ids[id], "Missing or duplicate practice-exam question ID: " .. id)
      assert(slot_marks[slot] and tonumber(attributes["data-marks"]) == slot_marks[slot],
        id .. ": invalid exam slot or marks")
      assert(attributes["data-bank-id"] and attributes["data-source"] and #question.content > 0,
        id .. ": missing Question Bank reference or prompt")
      ids[id] = true
      slots[slot] = true
      local is_specimen = attributes["data-exam-origin"] == "specimen"
      has_specimen = has_specimen or is_specimen
      has_other_bank_question = has_other_bank_question or not is_specimen
    elseif question.t == "Div" and question.classes:includes("exam-source-solution") then
      local id = question.attributes["data-question-id"]
      assert(id and id ~= "", "A worked solution needs a practice-exam question ID")
      assert(not solutions[id] and #question.content > 0, id .. ": duplicate or empty worked solution")
      solutions[id] = true
    end
  end
  for id in pairs(ids) do
    assert(solutions[id], id .. ": missing worked solution")
  end
  for id in pairs(solutions) do
    assert(ids[id], id .. ": worked solution has no question")
  end
  for slot in pairs(slot_marks) do
    assert(slots[slot], "No practice-exam questions in slot " .. slot)
  end
  assert(has_specimen and has_other_bank_question, "The practice exam needs specimen and other bank questions")
end

function Div(div)
  if div.identifier ~= "exam-question-pool" then return end
  append_bank_questions(div)
  validate_pool(div)
  return div
end
