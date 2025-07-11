# Probability Theory

Before delving into the core topics of statistical inference, we first review the essential concepts of probability theory.

## Probability of Events

Capital letters $ A $, $ B $ etc. are used to denote events that may or may not occur.

- The intersection $ A \cap B $ means that both $ A $ and $ B $ occur. The union $ A \cup B $ means that either $ A $ or $ B $ or both occur, i.e., at least one of them.
- The **addition rule** or the **inclusion-exclusion principle**:
  
   $$ \Pr(A \cup B) = \Pr(A) + \Pr(B) - \Pr(A \cap B). $$

- Events $ A $ and $ B $ are exclusive if they can’t both occur. This implies $ \Pr(A \cap B) = 0 $.
- Events $ A $ and $ B $ are exhaustive if at least one must occur. This implies $ \Pr(A \cup B) = 1 $.
  Similar definitions apply when there are more than two events.
- If $ A $ and $ B $ are independent then:
  
  $$ \Pr(A \cap B) = \Pr(A) \Pr(B). $$

- Provided $ \Pr(B) > 0 $, the conditional probability of $ A $ given that $ B $ has occurred is:
  
  $$ \Pr(A \mid B) = \frac{\Pr(A \cap B)}{\Pr(B)}. $$

- **Bayes' Theorem** states that, provided $ \Pr(B) > 0 $, then:
  
  $$ \Pr(A \mid B) = \frac{\Pr(B \mid A) \Pr(A)}{\Pr(B)}. $$

- Events $ B_1, B_2, \dots, B_n $ form a **partition** if exactly one of them must occur. Another way of saying the same thing is that $ B_1, B_2, \dots, B_n $ are mutually exclusive and exhaustive.
- If $ B_1, B_2, \dots, B_n $ form a partition, then for any other event $ A $, the **Theorem of Total Probability** tells us that:
  
  $$ \Pr(A) = \sum_{i=1}^{n} \Pr(A \mid B_i) \Pr(B_i). $$


```{prf:example} 
:label: student-example

Seventy percent of students are attentive in lectures and thirty percent are not. If a student is attentive the probability of passing the course is $0.8$. If a student is not attentive the probability of passing the course is $0.1$.

1. A student is selected at random. What is the probability that they pass the course?
2. Given that the student passed the course, what is the probability that they were attentive?

```


```{dropdown} Solution

Let

- $P$ denote the event of a student passing the course.
- $A$ denote the event of a student being attentive.
- $A^c$ denote the event of a student not being attentive.

1. For the first question, note that inattentive and attentive students form a partition of the sample space. Therefore, we can compute the required probability using the law of total probability:

$$ \Pr(P) = \Pr(P|A)\Pr(A) + \Pr(P|A^c)\Pr(A^c) = 0.8\cdot 0.7 + 0.1\cdot 0.3 = 0.59. $$

2. For the second question, we are asked to compute the probability $\Pr(A\mid P)$. Using Bayes theorem, which allows us to reverse the order of the conditional, we have

$$ \Pr(A\mid P) = \frac{\Pr(P\mid A) \Pr(A)}{\Pr(P)} = \frac{0.8\cdot 0.7}{0.59} = 0.949 \text{ (3 s.f.)}.  $$

```

## Random Variables

We use upper case letters to denote random variables, e.g., $X, Y, X_1, X_2, \dots$

The cumulative distribution function (cdf) is defined for all random variables. For a random
variable $X$, it is:

$$F(x) = \Pr(X \leq x)$$

This is sometimes just called the distribution function.

If $X$ is discrete, then its probability mass function (pmf) is:

$$p(x) = \Pr(X = x)$$

If $X$ is continuous, then its probability density function (pdf) is:

$$f(x) = \frac{dF(x)}{dx}$$

For continuous random variables, we find probabilities by looking at the area under the probability
density function over the appropriate interval.

**Important note:** When giving general results for this course, we will just refer to a distribution
$f(x \mid \theta)$, whatever the type of random variable, leaving unstated what the cdf, pmf, or pdf
(as appropriate) are, and leaving those for specific examples. Here, $\theta$ is a parameter that determines
the properties of the random variable.

