# Statistical Inference

## Statistical Inference as Inverse Probability Theory

Statistical inference involves drawing conclusions about a population based on a sample. In this course, we assume the population can be represented by a probability distribution $ f(x \mid \theta) $, where $ \theta $ is an unknown parameter.

Our sample typically consists of $ n $ independent random variables, $X_1, X_2, \dots, X_n $, each following the same distribution $ f(x \mid \theta) $. Since these variables are **independent and identically distributed (iid)**, we will use the terms "iid" and "random sample" interchangeably throughout the course to mean the same thing.


### Statistical Inference by Eye

As a basic example of inference, suppose that we have a random sample $X_1,\ldots, X_n$. We assume that each observation is an independent sample from a $\mathcal{N}(\mu, \sigma^2)$ distribution, where the parameters $\mu$ and $\sigma^2$ are unknown. We want to infer the unknown parameters. Let's do this by eye:

<iframe src="/d3-visualisations/plots/stat_by_eye.html" width="100%" height="600"></iframe>


