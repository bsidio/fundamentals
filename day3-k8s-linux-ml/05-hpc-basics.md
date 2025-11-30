# Day 3 - Afternoon: HPC Basics (30-45 min)

## Goals
- Understand Slurm-style job scheduling
- Know about GPU/CPU resource management
- Connect HPC concepts to your experiment tracker

---

## HPC Overview

### What is HPC?
High-Performance Computing clusters for compute-intensive workloads.

```
┌─────────────────────────────────────────────────────────────────┐
│                         HPC CLUSTER                              │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ Login Node  │ ◄── Users submit jobs here                    │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ Scheduler   │ ◄── SLURM: Manages queue and resources        │
│  │  (SLURM)    │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│    ┌────┴────┬────────┬────────┐                                │
│    ▼         ▼        ▼        ▼                                │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐                             │
│  │Node│   │Node│   │Node│   │Node│                             │
│  │GPU │   │GPU │   │GPU │   │CPU │                             │
│  └────┘   └────┘   └────┘   └────┘                             │
│                                                                  │
│  ┌──────────────────────────────────────────┐                   │
│  │        Shared Storage (NFS/Lustre)        │                  │
│  │    Models, datasets, checkpoints, logs    │                  │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## SLURM Basics

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Job** | A request to run a workload |
| **Queue/Partition** | Group of nodes with similar resources |
| **Node** | Individual machine in the cluster |
| **Task** | A process within a job |
| **Allocation** | Reserved resources for a job |

### Submitting Jobs

```bash
# Simple job script (train_model.sh)
#!/bin/bash
#SBATCH --job-name=hyperopt-v1
#SBATCH --partition=gpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --gres=gpu:1
#SBATCH --time=24:00:00
#SBATCH --output=logs/%j.out
#SBATCH --error=logs/%j.err

# Load required modules
module load python/3.11
module load cuda/12.0

# Activate environment
source /path/to/venv/bin/activate

# Run training
python train.py \
    --experiment-id $EXPERIMENT_ID \
    --learning-rate 0.001 \
    --batch-size 32 \
    --epochs 100

# Submit job
sbatch train_model.sh
```

### Common SLURM Commands

```bash
# Submit job
sbatch script.sh

# View queue
squeue                      # All jobs
squeue -u $USER             # My jobs

# Job details
scontrol show job <job_id>

# Cancel job
scancel <job_id>
scancel -u $USER            # All my jobs

# Node information
sinfo                       # Cluster overview
sinfo -N -l                 # Detailed node list

# Interactive session
srun --pty --partition=gpu --gres=gpu:1 --time=2:00:00 bash
```

---

## Resource Management

### Resource Types

```bash
#SBATCH --cpus-per-task=8   # CPU cores
#SBATCH --mem=32G           # RAM
#SBATCH --gres=gpu:1        # GPUs (1 GPU)
#SBATCH --gres=gpu:a100:2   # Specific GPU type, 2 of them
#SBATCH --time=24:00:00     # Wall clock time
```

### Partitions (Queues)

```bash
# Different queues for different resources
#SBATCH --partition=cpu     # CPU-only jobs
#SBATCH --partition=gpu     # GPU jobs
#SBATCH --partition=highmem # High memory jobs
#SBATCH --partition=debug   # Quick tests (short time limit)
```

### Job Priority Factors
- Wait time (longer wait = higher priority)
- Fair share (users who used less = higher priority)
- Job size (sometimes smaller = higher priority)
- Partition priority

---

## Logs and Artifacts

### Where Things Live

```
/shared/
├── datasets/           # Shared datasets
│   ├── imagenet/
│   └── coco/
├── models/             # Pre-trained models
└── users/
    └── alice/
        ├── experiments/
        │   └── exp-001/
        │       ├── config.yaml
        │       ├── checkpoints/
        │       │   ├── epoch_10.pt
        │       │   └── best_model.pt
        │       └── logs/
        │           ├── train.log
        │           └── tensorboard/
        └── jobs/
            ├── 12345.out    # SLURM output
            └── 12345.err    # SLURM errors
```

### Accessing Logs

```bash
# SLURM output files
cat logs/12345.out

# TensorBoard logs
tensorboard --logdir=/shared/users/alice/experiments/exp-001/logs/tensorboard

# Tail running job output
tail -f logs/12345.out
```

---

## Integration with Experiment Tracker

### How the Tracker Would Work with HPC

```
┌──────────────────┐
│ Experiment       │
│ Tracker UI       │
└────────┬─────────┘
         │ "Start Experiment"
         ▼
┌──────────────────┐
│ API Server       │
│ (creates exp ID) │
└────────┬─────────┘
         │ Submit job via SSH/API
         ▼
┌──────────────────┐
│ SLURM Scheduler  │
│ (queues job)     │
└────────┬─────────┘
         │ Allocates resources
         ▼
┌──────────────────┐         ┌──────────────────┐
│ Training Script  │ ─────►  │ Tracker API      │
│ (on GPU node)    │         │ (log metrics)    │
└────────┬─────────┘         └──────────────────┘
         │
         ▼
┌──────────────────┐
│ Shared Storage   │
│ (checkpoints)    │
└──────────────────┘
```

### Training Script Integration

```python
# train.py - runs on HPC node
import os
import requests

TRACKER_API = os.environ.get("TRACKER_API", "http://tracker.internal")
EXPERIMENT_ID = os.environ["EXPERIMENT_ID"]
SLURM_JOB_ID = os.environ.get("SLURM_JOB_ID")

def create_run():
    response = requests.post(
        f"{TRACKER_API}/experiments/{EXPERIMENT_ID}/runs",
        json={
            "slurm_job_id": SLURM_JOB_ID,
            "seed": args.seed,
            "config": vars(args)
        }
    )
    return response.json()["run_id"]

def log_metric(run_id, name, value, step):
    requests.post(
        f"{TRACKER_API}/runs/{run_id}/metrics",
        json={"name": name, "value": value, "step": step}
    )

# Training loop
run_id = create_run()
for epoch in range(num_epochs):
    train_loss = train_epoch()
    val_acc = validate()

    log_metric(run_id, "train_loss", train_loss, epoch)
    log_metric(run_id, "val_accuracy", val_acc, epoch)

    # Save checkpoint to shared storage
    if val_acc > best_acc:
        torch.save(model.state_dict(), f"/shared/checkpoints/{run_id}/best.pt")
```

### Polling vs Events

**Option 1: Polling**
```python
# Tracker periodically checks job status
def poll_slurm_jobs():
    for run in db.get_active_runs():
        if run.slurm_job_id:
            status = get_slurm_job_status(run.slurm_job_id)
            if status != run.status:
                db.update_run_status(run.id, status)
```

**Option 2: Events (via SLURM epilog)**
```bash
# /etc/slurm/epilog.d/notify_tracker.sh
#!/bin/bash
curl -X POST http://tracker.internal/webhooks/slurm \
    -d "job_id=$SLURM_JOB_ID&status=completed"
```

---

## Interview Talking Point

### "How would your tool integrate with a GPU cluster?"

> "The tool would integrate with SLURM through two mechanisms. First, when starting a run, we'd store the SLURM job ID. The training script would call our API to log metrics and update status as it runs.
>
> Second, we'd either poll SLURM for job status changes or use SLURM's epilog scripts to send a webhook when jobs complete. This keeps the dashboard in sync with actual cluster state.
>
> Checkpoints and logs would go to shared storage that's mounted on all compute nodes, with paths stored in our database for later retrieval."

### "How would you coordinate hardware resource usage?"

> "Resource allocation is handled by SLURM - jobs request GPUs, memory, and time, and the scheduler assigns nodes based on availability and priority. Our tracker would help by showing what resources experiments need and which are currently in use.
>
> We could also implement a resource planning view that shows scheduled jobs and their resource requirements, helping users choose when to submit jobs for faster turnaround."

---

## GPU Computing Fundamentals

### GPU Architecture Overview
```
┌───────────────────────────────────────────────────────────────────┐
│                           GPU (e.g., A100)                         │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │     SM      │  │     SM      │  │     SM      │   ... x 108   │
│  │  (Streaming │  │  (Streaming │  │  (Streaming │   (A100)      │
│  │ Multiproc.) │  │ Multiproc.) │  │ Multiproc.) │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                    │
│  ┌──────────────────────────────────────────────────┐             │
│  │              HBM2e Memory (80GB on A100)          │             │
│  │           Bandwidth: 2TB/s                         │             │
│  └──────────────────────────────────────────────────┘             │
│                                                                    │
│  Tensor Cores: Matrix multiplication (FP16, BF16, INT8)           │
│  CUDA Cores: General parallel compute                              │
└───────────────────────────────────────────────────────────────────┘
```

### GPU Types and Specs

| GPU | VRAM | Use Case | FP16 TFLOPs |
|-----|------|----------|-------------|
| A100 | 40/80GB | Training large models | 312 |
| H100 | 80GB | Transformer training | 989 |
| V100 | 16/32GB | Training medium models | 125 |
| L4 | 24GB | Inference | 121 |
| T4 | 16GB | Inference, light training | 65 |

### Memory Management
```python
import torch

# Check GPU availability
print(torch.cuda.is_available())
print(torch.cuda.device_count())
print(torch.cuda.get_device_name(0))

# Memory info
print(f"Allocated: {torch.cuda.memory_allocated()/1e9:.2f} GB")
print(f"Cached: {torch.cuda.memory_reserved()/1e9:.2f} GB")

# Clear cache (useful when OOM)
torch.cuda.empty_cache()

# Gradient checkpointing to save memory
from torch.utils.checkpoint import checkpoint
# Recompute activations in backward pass instead of storing
```

### Common OOM Solutions
```python
# 1. Reduce batch size
batch_size = 16  # Try smaller if OOM

# 2. Mixed precision training
from torch.cuda.amp import autocast, GradScaler
scaler = GradScaler()

with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, labels)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()

# 3. Gradient accumulation
accumulation_steps = 4
for i, (inputs, labels) in enumerate(dataloader):
    outputs = model(inputs)
    loss = criterion(outputs, labels) / accumulation_steps
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# 4. Model parallelism for very large models
# Split model across multiple GPUs
```

---

## Multi-GPU Training

### Data Parallelism
```python
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

# Initialize distributed training
dist.init_process_group(backend='nccl')
local_rank = int(os.environ['LOCAL_RANK'])
torch.cuda.set_device(local_rank)

# Wrap model with DDP
model = model.to(local_rank)
model = DDP(model, device_ids=[local_rank])

# Use DistributedSampler for dataset
from torch.utils.data.distributed import DistributedSampler
sampler = DistributedSampler(dataset)
dataloader = DataLoader(dataset, sampler=sampler, batch_size=batch_size)

# Training loop
for epoch in range(num_epochs):
    sampler.set_epoch(epoch)  # Important for shuffling
    for batch in dataloader:
        # Training happens automatically across GPUs
        ...
```

### SLURM Multi-GPU Script
```bash
#!/bin/bash
#SBATCH --job-name=multi-gpu-train
#SBATCH --partition=gpu
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=4
#SBATCH --cpus-per-task=8
#SBATCH --gres=gpu:4
#SBATCH --time=48:00:00

# Total GPUs = nodes * ntasks-per-node = 2 * 4 = 8 GPUs

# Set up distributed environment
export MASTER_ADDR=$(scontrol show hostnames $SLURM_JOB_NODELIST | head -n 1)
export MASTER_PORT=29500
export WORLD_SIZE=$SLURM_NTASKS

# Launch with torchrun
srun torchrun \
    --nnodes=$SLURM_NNODES \
    --nproc_per_node=4 \
    --rdzv_id=$SLURM_JOB_ID \
    --rdzv_backend=c10d \
    --rdzv_endpoint=$MASTER_ADDR:$MASTER_PORT \
    train.py --batch-size 64
```

### Model Parallelism (Pipeline)
```python
# For models too large for single GPU
from torch.distributed.pipeline.sync import Pipe

# Split model into stages
class PipelineModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.stage1 = nn.Sequential(...).to('cuda:0')
        self.stage2 = nn.Sequential(...).to('cuda:1')
        self.stage3 = nn.Sequential(...).to('cuda:2')

# Use Pipe for automatic pipelining
model = Pipe(model, chunks=8)  # Split batch into micro-batches
```

---

## Advanced SLURM Features

### Job Arrays
```bash
#!/bin/bash
#SBATCH --job-name=hyperopt
#SBATCH --array=0-9        # 10 jobs (indices 0-9)
#SBATCH --partition=gpu
#SBATCH --gres=gpu:1

# Each job gets unique SLURM_ARRAY_TASK_ID
python train.py \
    --learning-rate $(python -c "print([0.001, 0.0001, 0.01][$SLURM_ARRAY_TASK_ID % 3])") \
    --seed $SLURM_ARRAY_TASK_ID

# Submit: sbatch array_job.sh
# Cancel specific: scancel 12345_3  (job 12345, task 3)
# Cancel all: scancel 12345
```

### Job Dependencies
```bash
# Submit dependent jobs
job1=$(sbatch --parsable preprocess.sh)
job2=$(sbatch --parsable --dependency=afterok:$job1 train.sh)
job3=$(sbatch --parsable --dependency=afterok:$job2 evaluate.sh)

# Dependency types:
# afterok:jobid    - Run after job completes successfully
# afternotok:jobid - Run after job fails
# afterany:jobid   - Run after job finishes (any status)
# after:jobid      - Run after job starts
```

### Resource Monitoring
```bash
# Check job efficiency
seff <job_id>

# Output example:
# Job ID: 12345
# Cores: 8
# CPU Utilized: 06:42:00
# CPU Efficiency: 83.75% of 08:00:00 core-walltime
# Memory Utilized: 28.5 GB
# Memory Efficiency: 89.06% of 32.00 GB

# Real-time GPU monitoring
nvidia-smi
nvidia-smi -l 1  # Update every second

# GPU usage for running job
srun --jobid=12345 nvidia-smi
```

### Advanced Resource Requests
```bash
#!/bin/bash
#SBATCH --job-name=large-model
#SBATCH --partition=gpu
#SBATCH --nodes=4
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=32
#SBATCH --mem=256G
#SBATCH --gres=gpu:a100:8       # 8 A100 GPUs per node
#SBATCH --time=7-00:00:00       # 7 days
#SBATCH --exclusive             # No sharing node
#SBATCH --constraint=nvlink     # Require NVLink interconnect

# QoS (Quality of Service) for priority
#SBATCH --qos=high-priority

# Email notifications
#SBATCH --mail-type=BEGIN,END,FAIL
#SBATCH --mail-user=user@example.com
```

---

## Shared Storage Systems

### Storage Types

| Type | Capacity | Speed | Use Case |
|------|----------|-------|----------|
| NFS | Medium | Slow | Home dirs, configs |
| Lustre | Large | Fast | Datasets, checkpoints |
| Local SSD | Small | Very Fast | Temp files, cache |
| Object (S3) | Unlimited | Medium | Archives, models |

### Best Practices
```bash
# 1. Use local SSD for temporary files
TMPDIR=/local/scratch/$SLURM_JOB_ID
mkdir -p $TMPDIR

# Copy dataset to local for faster access
cp /shared/datasets/data.tar $TMPDIR/
tar xf $TMPDIR/data.tar -C $TMPDIR/

# Train with local data
python train.py --data-dir $TMPDIR/data

# Copy results back
cp -r $TMPDIR/checkpoints /shared/results/$SLURM_JOB_ID/

# Clean up
rm -rf $TMPDIR


# 2. Use scratch for intermediate files
export SCRATCH=/scratch/$USER/$SLURM_JOB_ID
mkdir -p $SCRATCH

# 3. Stage data before training
# For large datasets, stage once and reuse
if [ ! -d /scratch/shared/imagenet ]; then
    sbatch --dependency=singleton --wrap="tar xf /archive/imagenet.tar -C /scratch/shared/"
fi
```

### Data Loading Optimization
```python
from torch.utils.data import DataLoader

# Optimize data loading
dataloader = DataLoader(
    dataset,
    batch_size=batch_size,
    num_workers=8,           # Parallel data loading
    pin_memory=True,         # Faster GPU transfer
    prefetch_factor=2,       # Prefetch batches
    persistent_workers=True  # Keep workers alive
)

# Use memory-mapped files for large datasets
import numpy as np
data = np.memmap('/scratch/data.npy', dtype='float32', mode='r', shape=(1000000, 768))
```

---

## Cluster Monitoring and Debugging

### Job Debugging
```bash
# Why is my job pending?
squeue -u $USER -t PENDING --format="%.18i %.9P %.20j %.8u %.8T %.10M %.9l %.6D %R"
# Reason codes:
# Priority       - Waiting for higher priority jobs
# Resources      - Waiting for resources
# QOSMaxJobsPerUserLimit - Hit QoS job limit
# ReqNodeNotAvail - Requested node unavailable

# Check job details
scontrol show job 12345

# View job history
sacct -j 12345 --format=JobID,Elapsed,MaxRSS,MaxVMSize,State

# Check node status
sinfo -N -l
scontrol show node gpu-node-01
```

### Common Issues and Solutions

**Job keeps getting killed:**
```bash
# Check if OOM killed
sacct -j 12345 --format=JobID,State,ExitCode,MaxRSS
# MaxRSS close to requested memory = increase --mem

# Check time limit
scontrol show job 12345 | grep TimeLimit
# TIMEOUT exit = increase --time
```

**Poor GPU utilization:**
```python
# Profile GPU usage
import torch.profiler

with torch.profiler.profile(
    activities=[
        torch.profiler.ProfilerActivity.CPU,
        torch.profiler.ProfilerActivity.CUDA,
    ],
    schedule=torch.profiler.schedule(wait=1, warmup=1, active=3),
    on_trace_ready=torch.profiler.tensorboard_trace_handler('./log'),
) as prof:
    for step, batch in enumerate(dataloader):
        if step >= (1 + 1 + 3):
            break
        train_step(batch)
        prof.step()

# Common issues:
# - Data loading bottleneck (increase num_workers)
# - Small batch size (GPU underutilized)
# - Too much CPU preprocessing
```

**Distributed training issues:**
```bash
# Debug NCCL
export NCCL_DEBUG=INFO
export NCCL_DEBUG_SUBSYS=ALL

# Check network connectivity between nodes
srun --nodes=2 --ntasks=2 hostname

# Test GPU-to-GPU bandwidth
# On each node: nvidia-smi nvlink -s
```

---

## Integration Patterns

### Full Tracker Integration
```python
# tracker_client.py - HPC-friendly client
import os
import requests
from functools import lru_cache

class TrackerClient:
    def __init__(self):
        self.api_url = os.environ.get("TRACKER_API", "http://tracker.internal")
        self.api_key = os.environ.get("TRACKER_API_KEY")
        self.headers = {"X-API-Key": self.api_key} if self.api_key else {}

        # Job metadata
        self.slurm_job_id = os.environ.get("SLURM_JOB_ID")
        self.slurm_node = os.environ.get("SLURMD_NODENAME")
        self.experiment_id = os.environ.get("EXPERIMENT_ID")

    def create_run(self, config: dict) -> str:
        response = requests.post(
            f"{self.api_url}/experiments/{self.experiment_id}/runs",
            json={
                "slurm_job_id": self.slurm_job_id,
                "slurm_node": self.slurm_node,
                "config": config,
                "gpu_type": self._get_gpu_type()
            },
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["run_id"]

    def log_metrics(self, run_id: str, metrics: dict, step: int):
        # Batch metrics for efficiency
        requests.post(
            f"{self.api_url}/runs/{run_id}/metrics/batch",
            json={
                "step": step,
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat()
            },
            headers=self.headers
        )

    def log_artifact(self, run_id: str, path: str, artifact_type: str):
        requests.post(
            f"{self.api_url}/runs/{run_id}/artifacts",
            json={
                "path": path,
                "type": artifact_type,
                "size_bytes": os.path.getsize(path)
            },
            headers=self.headers
        )

    @lru_cache
    def _get_gpu_type(self) -> str:
        try:
            import subprocess
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                capture_output=True, text=True
            )
            return result.stdout.strip().split('\n')[0]
        except:
            return "unknown"


# Usage in training script
tracker = TrackerClient()
run_id = tracker.create_run(config=vars(args))

for epoch in range(num_epochs):
    train_loss = train_one_epoch()
    val_loss, val_acc = validate()

    tracker.log_metrics(run_id, {
        "train_loss": train_loss,
        "val_loss": val_loss,
        "val_accuracy": val_acc,
        "gpu_memory_used": torch.cuda.memory_allocated() / 1e9,
        "learning_rate": scheduler.get_last_lr()[0]
    }, step=epoch)

    # Save and log checkpoint
    if val_acc > best_acc:
        checkpoint_path = f"/shared/checkpoints/{run_id}/best.pt"
        torch.save(model.state_dict(), checkpoint_path)
        tracker.log_artifact(run_id, checkpoint_path, "model_checkpoint")
```

### Webhook Handler for SLURM Events
```python
# In tracker API
from fastapi import FastAPI, Request

@app.post("/webhooks/slurm")
async def slurm_webhook(request: Request):
    data = await request.form()
    job_id = data.get("job_id")
    status = data.get("status")
    exit_code = data.get("exit_code")

    # Find run by SLURM job ID
    run = db.query(Run).filter(Run.slurm_job_id == job_id).first()
    if run:
        run.status = "completed" if exit_code == "0" else "failed"
        run.ended_at = datetime.utcnow()
        db.commit()

        # Invalidate cache
        redis.delete(f"exp:summary:{run.experiment_id}")

        # Notify connected clients
        await websocket_manager.broadcast({
            "event": "run_status_changed",
            "run_id": str(run.id),
            "status": run.status
        })

    return {"received": True}
```

---

## Interview Talking Point

### "How would your tool integrate with a GPU cluster?"

> "The tool would integrate with SLURM through two mechanisms. First, when starting a run, we'd store the SLURM job ID. The training script would call our API to log metrics and update status as it runs.
>
> Second, we'd either poll SLURM for job status changes or use SLURM's epilog scripts to send a webhook when jobs complete. This keeps the dashboard in sync with actual cluster state.
>
> Checkpoints and logs would go to shared storage that's mounted on all compute nodes, with paths stored in our database for later retrieval."

### "How would you coordinate hardware resource usage?"

> "Resource allocation is handled by SLURM - jobs request GPUs, memory, and time, and the scheduler assigns nodes based on availability and priority. Our tracker would help by showing what resources experiments need and which are currently in use.
>
> We could also implement a resource planning view that shows scheduled jobs and their resource requirements, helping users choose when to submit jobs for faster turnaround."

### "How would you handle multi-GPU training?"

> "For multi-GPU training, we'd use PyTorch's DistributedDataParallel with NCCL backend. The SLURM script requests multiple GPUs and sets up the distributed environment variables. Each process logs metrics, but only rank 0 would report to the tracker to avoid duplicates.
>
> For very large models, we could use model parallelism to split the model across GPUs, or use frameworks like DeepSpeed or FSDP that handle this automatically."

---

## Checkpoint Questions

### SLURM Basics
- [ ] What is SLURM and what does it do?
- [ ] How do you request GPU resources?
- [ ] Where do logs and checkpoints go?
- [ ] How would your tracker know when a job finishes?
- [ ] What's the difference between polling and event-driven updates?

### GPU Computing
- [ ] What's the difference between data parallelism and model parallelism?
- [ ] How do you handle OOM errors during training?
- [ ] What is mixed precision training?
- [ ] How does DistributedDataParallel work?

### Advanced Topics
- [ ] What are job arrays and when would you use them?
- [ ] How do you set up job dependencies?
- [ ] What storage types exist on HPC clusters?
- [ ] How do you debug poor GPU utilization?

---

## Checkpoint Answers

### SLURM Basics
- **What is SLURM**: A job scheduler that manages compute resources, queues jobs, and allocates nodes.
- **Request GPUs**: `#SBATCH --gres=gpu:1` or `#SBATCH --gres=gpu:a100:2` for specific type.
- **Logs/checkpoints**: Shared filesystem (NFS/Lustre) accessible from all nodes.
- **Job completion**: Either poll SLURM with `squeue`/`sacct`, or use epilog webhook.
- **Polling vs events**: Polling is simpler but has latency. Events are immediate but require cluster configuration.

### GPU Computing
- **Data vs model parallelism**: Data parallelism splits batches across GPUs (same model). Model parallelism splits model layers across GPUs (for huge models).
- **OOM handling**: Reduce batch size, use gradient accumulation, mixed precision, gradient checkpointing.
- **Mixed precision**: Use FP16 for forward/backward, FP32 for gradients. 2x memory savings, faster compute.
- **DDP**: Each GPU has full model copy. Gradients are averaged across GPUs after backward pass.

### Advanced Topics
- **Job arrays**: Run same script with different parameters. Good for hyperparameter search.
- **Job dependencies**: Chain jobs with `--dependency=afterok:jobid`. For preprocessing → training → evaluation.
- **Storage types**: NFS (slow, shared), Lustre (fast, parallel), local SSD (fastest, ephemeral).
- **Poor GPU utilization**: Profile with torch.profiler. Common causes: data loading bottleneck, small batches, CPU preprocessing.
