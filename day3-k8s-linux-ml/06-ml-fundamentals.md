# Day 3 - Evening: ML Fundamentals (1-2h)

## Goals
- Understand ML concepts at a practical infrastructure level
- Know what your experiment tracker tracks
- Be familiar with MLflow/Weights & Biases

---

## ML Concepts for Infrastructure

### What is an Experiment?

An experiment is a systematic test of a hypothesis about model performance.

```
Experiment: "Does increasing model depth improve accuracy?"

├── Run 1: layers=2, lr=0.001 → accuracy=0.85
├── Run 2: layers=4, lr=0.001 → accuracy=0.89
├── Run 3: layers=8, lr=0.001 → accuracy=0.91
└── Run 4: layers=16, lr=0.001 → accuracy=0.88 (overfitting)

Conclusion: 8 layers is optimal for this dataset
```

### Training Concepts

| Term | Definition | Analogy |
|------|------------|---------|
| **Epoch** | One pass through entire dataset | Reading a book once |
| **Batch** | Subset of data processed together | Reading one chapter |
| **Step/Iteration** | One batch update | Reading one page |
| **Learning Rate** | How much to adjust weights | Step size when walking |

```python
# Training loop structure
for epoch in range(num_epochs):           # 100 epochs
    for batch in dataloader:              # 1000 batches per epoch
        loss = model(batch)               # Forward pass
        loss.backward()                   # Backward pass
        optimizer.step()                  # Update weights
        # This is one "step" - 100,000 steps total
```

### Data Splits

```
┌─────────────────────────────────────────────────────────────────┐
│                         FULL DATASET                             │
├───────────────────────────────┬─────────────┬───────────────────┤
│         Training (70%)         │  Val (15%)  │    Test (15%)     │
│    Model learns from this      │ Tune hyper- │ Final evaluation  │
│                                │  parameters │   (once only)     │
└───────────────────────────────┴─────────────┴───────────────────┘
```

---

## Common Metrics

### Classification Metrics

```python
# Confusion Matrix
#                  Predicted
#                  Pos    Neg
# Actual Pos      [ TP  |  FN ]
#        Neg      [ FP  |  TN ]

# Accuracy: (TP + TN) / Total
# Good when classes are balanced

# Precision: TP / (TP + FP)
# "Of predicted positives, how many are correct?"
# Important when false positives are costly (spam detection)

# Recall: TP / (TP + FN)
# "Of actual positives, how many did we find?"
# Important when false negatives are costly (disease detection)

# F1 Score: 2 * (Precision * Recall) / (Precision + Recall)
# Harmonic mean of precision and recall
```

### Regression Metrics

```python
# Mean Squared Error (MSE)
mse = mean((predicted - actual)^2)

# Root Mean Squared Error (RMSE)
rmse = sqrt(mse)  # Same units as target

# Mean Absolute Error (MAE)
mae = mean(abs(predicted - actual))

# R² Score
# 1.0 = perfect, 0.0 = baseline (mean), negative = worse than mean
```

### Training Metrics

```python
# Loss: What the model optimizes (lower is better)
# - Cross-entropy for classification
# - MSE for regression

# Training loss vs Validation loss:
# - Both decreasing → Good, keep training
# - Training down, Validation up → Overfitting, stop training
# - Both flat → Learning rate too low or model capacity issue
```

---

## The Training Loop

```python
import torch
import torch.nn as nn

# Model, optimizer, loss function
model = MyModel()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

# Training loop
for epoch in range(num_epochs):
    model.train()
    train_loss = 0

    for batch_idx, (data, target) in enumerate(train_loader):
        # Forward pass
        output = model(data)
        loss = criterion(output, target)

        # Backward pass
        optimizer.zero_grad()  # Reset gradients
        loss.backward()        # Compute gradients
        optimizer.step()       # Update weights

        train_loss += loss.item()

        # Log to experiment tracker
        if batch_idx % 100 == 0:
            tracker.log_metric("train_loss", loss.item(), step=global_step)

    # Validation
    model.eval()
    val_loss = 0
    correct = 0

    with torch.no_grad():
        for data, target in val_loader:
            output = model(data)
            val_loss += criterion(output, target).item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()

    val_accuracy = correct / len(val_loader.dataset)

    # Log epoch metrics
    tracker.log_metric("val_loss", val_loss, step=epoch)
    tracker.log_metric("val_accuracy", val_accuracy, step=epoch)

    # Save checkpoint
    if val_accuracy > best_accuracy:
        best_accuracy = val_accuracy
        torch.save(model.state_dict(), f"checkpoints/best_model.pt")
```

---

## What Your Tracker Tracks

### 1. Hyperparameters (Configuration)

```python
hyperparameters = {
    "model": {
        "architecture": "resnet50",
        "num_layers": 50,
        "hidden_size": 256
    },
    "training": {
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 100,
        "optimizer": "adam",
        "weight_decay": 1e-5
    },
    "data": {
        "dataset": "imagenet",
        "augmentation": ["flip", "rotate", "crop"]
    }
}
```

### 2. Metrics (Over Steps/Epochs)

```python
metrics = {
    "train_loss": [2.3, 1.8, 1.2, 0.8, ...],     # Per step
    "val_loss": [2.1, 1.5, 1.0, 0.7, ...],       # Per epoch
    "val_accuracy": [0.3, 0.5, 0.7, 0.85, ...],  # Per epoch
    "learning_rate": [0.001, 0.0008, 0.0005, ...] # If using scheduler
}
```

### 3. Artifacts

```python
artifacts = {
    "model_checkpoint": "s3://models/exp-001/run-042/best_model.pt",
    "training_logs": "s3://logs/exp-001/run-042/train.log",
    "tensorboard": "s3://logs/exp-001/run-042/tensorboard/",
    "confusion_matrix": "s3://artifacts/exp-001/run-042/confusion_matrix.png",
    "predictions": "s3://artifacts/exp-001/run-042/predictions.csv"
}
```

### 4. Code Version

```python
code_info = {
    "git_commit": "a1b2c3d4e5f6...",
    "git_branch": "feature/new-model",
    "git_dirty": False,  # No uncommitted changes
    "requirements": "requirements.txt content or hash"
}
```

### 5. Environment

```python
environment = {
    "python_version": "3.11.0",
    "pytorch_version": "2.0.0",
    "cuda_version": "12.0",
    "gpu_type": "NVIDIA A100",
    "num_gpus": 4,
    "hostname": "gpu-node-042"
}
```

---

## MLflow / Weights & Biases

### MLflow

```python
import mlflow

# Start run
with mlflow.start_run():
    # Log parameters
    mlflow.log_param("learning_rate", 0.001)
    mlflow.log_param("batch_size", 32)

    # Training...
    for epoch in range(num_epochs):
        # Log metrics
        mlflow.log_metric("train_loss", train_loss, step=epoch)
        mlflow.log_metric("val_accuracy", val_accuracy, step=epoch)

    # Log artifacts
    mlflow.log_artifact("model.pt")

    # Log model
    mlflow.pytorch.log_model(model, "model")
```

### Weights & Biases

```python
import wandb

# Initialize
wandb.init(project="my-project", config={
    "learning_rate": 0.001,
    "batch_size": 32
})

# Training...
for epoch in range(num_epochs):
    # Log metrics
    wandb.log({
        "train_loss": train_loss,
        "val_accuracy": val_accuracy
    })

# Log artifacts
wandb.save("model.pt")

wandb.finish()
```

### What They Provide

| Feature | MLflow | W&B |
|---------|--------|-----|
| Experiment tracking | ✓ | ✓ |
| Metric visualization | ✓ | ✓ (better) |
| Artifact storage | ✓ | ✓ |
| Model registry | ✓ | ✓ |
| Collaboration | Basic | ✓ (teams, reports) |
| Hosting | Self-hosted or managed | Managed (free tier) |

---

## Interview Ready Summary

### "What exactly does your tool track?"

> "It tracks everything needed to reproduce and compare experiments:
>
> 1. **Hyperparameters** - The configuration for each run like learning rate, batch size, model architecture
> 2. **Metrics** - Training and validation metrics over time, like loss and accuracy at each epoch
> 3. **Artifacts** - Model checkpoints, logs, visualizations stored on shared storage
> 4. **Code version** - Git commit hash so you know exactly what code produced each result
> 5. **Environment** - Python version, CUDA version, GPU type for reproducibility"

### "What are MLflow and Weights & Biases?"

> "They're popular experiment tracking platforms. MLflow is open-source and can be self-hosted - it provides tracking, a model registry, and deployment tools. Weights & Biases is a managed service with better visualization and collaboration features. Both solve the problem of keeping track of ML experiments and comparing results.
>
> My tracker implements similar core functionality - logging params, metrics, and artifacts - but focused on our specific workflow and integration with our HPC cluster."

---

## Checkpoint Questions

- [ ] What's the difference between an epoch and a batch?
- [ ] When does overfitting occur and how do you detect it?
- [ ] What metrics would you track for a classification problem?
- [ ] What artifacts does a training run produce?
- [ ] What does MLflow/W&B do?
