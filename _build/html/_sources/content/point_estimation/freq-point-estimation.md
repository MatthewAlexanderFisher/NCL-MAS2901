# Central Limit Theorem

Two of the most important estimators are the sample mean and sample variance.

## Sample Mean

```{prf:definition} Sample Mean
:label: sample_mean

The sample mean of a **random sample** $X_1,\ldots,X_n$ is 

$$ \bar{X} = \frac{1}{n}\sum_{i=1}^n X_i. $$

```

The **sample mean** is an unbiased estimator of the population mean.

```{dropdown} Proof

We have

$$\mathrm{E}[\bar{X}] = \mathrm{E}\left[\frac{1}{n}\sum_{i=1}^n X_i\right] = \frac{1}{n}\sum_{i=1}^n \mu = \mu. $$

```


## Sample Variance

```{prf:definition} Sample Variance
:label: sample_variance

The sample mean of a **random sample** $X_1,\ldots,X_n$ is 

$$ s^2 = \frac{1}{n-1}\sum_{i=1}^n (X_i - \bar{X})^2. $$

```

