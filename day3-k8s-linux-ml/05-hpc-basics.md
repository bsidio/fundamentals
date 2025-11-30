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

## Checkpoint Questions

- [ ] What is SLURM and what does it do?
- [ ] How do you request GPU resources?
- [ ] Where do logs and checkpoints go?
- [ ] How would your tracker know when a job finishes?
- [ ] What's the difference between polling and event-driven updates?
