# Day 3 - Afternoon: Linux Fundamentals (1-1.5h)

## Goals
- Be confident navigating Linux systems
- Know essential debugging commands
- Understand process and resource management
- Master shell scripting basics
- Learn system administration essentials

---

## Linux Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER APPLICATIONS                     │
│              (bash, python, nginx, docker)               │
├─────────────────────────────────────────────────────────┤
│                     SYSTEM CALLS                         │
│            (open, read, write, fork, exec)               │
├─────────────────────────────────────────────────────────┤
│                        KERNEL                            │
│  ┌─────────────┬─────────────┬─────────────────────┐   │
│  │   Process   │   Memory    │     File System     │   │
│  │  Scheduler  │  Manager    │        (VFS)        │   │
│  ├─────────────┼─────────────┼─────────────────────┤   │
│  │   Network   │   Device    │      Security       │   │
│  │    Stack    │   Drivers   │      (SELinux)      │   │
│  └─────────────┴─────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                       HARDWARE                           │
│              (CPU, Memory, Disk, Network)                │
└─────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Process** | Running instance of a program |
| **Thread** | Lightweight process, shares memory |
| **File Descriptor** | Integer reference to open file/socket |
| **inode** | Data structure storing file metadata |
| **Virtual Memory** | Abstraction giving each process own address space |
| **System Call** | Interface between user space and kernel |

---

## File System Hierarchy

```
/
├── bin/          # Essential user binaries (ls, cp, bash)
├── sbin/         # System binaries (init, iptables)
├── etc/          # Configuration files
├── home/         # User home directories
├── var/          # Variable data (logs, databases, mail)
│   ├── log/      # System and application logs
│   ├── run/      # Runtime data (PIDs, sockets)
│   └── tmp/      # Temporary files (persists reboot)
├── tmp/          # Temporary files (cleared on reboot)
├── usr/          # User programs and data
│   ├── bin/      # User binaries
│   ├── lib/      # Libraries
│   └── share/    # Architecture-independent data
├── opt/          # Optional/third-party software
├── proc/         # Virtual filesystem for process info
├── sys/          # Virtual filesystem for kernel/hardware info
└── dev/          # Device files
```

### Important Files

```bash
/etc/passwd       # User accounts
/etc/shadow       # Encrypted passwords
/etc/hosts        # Local DNS overrides
/etc/resolv.conf  # DNS resolver config
/etc/fstab        # Filesystem mount table
/etc/crontab      # System cron jobs
/etc/systemd/     # Systemd unit files
/proc/cpuinfo     # CPU information
/proc/meminfo     # Memory information
/proc/<PID>/      # Process-specific info
```

---

## Essential Commands

### Process Management

```bash
# List processes
ps aux                      # All processes with details
ps aux | grep python        # Find Python processes
ps -ef --forest             # Process tree

# Interactive process viewer
top                         # Basic
htop                        # Better (if installed)

# Key columns in top/htop:
# PID   - Process ID
# USER  - Owner
# %CPU  - CPU usage
# %MEM  - Memory usage
# TIME+ - Total CPU time
# COMMAND - Command name
```

### Disk Usage

```bash
# Disk space overview
df -h                       # Human-readable disk free
df -h /                     # Specific mount point

# Directory sizes
du -sh *                    # Size of each item in current dir
du -sh /var/log             # Size of specific directory
du -h --max-depth=1 /       # Top-level directory sizes

# Find large files
find / -type f -size +100M 2>/dev/null | head -20
```

### Log Investigation

```bash
# Systemd service logs
journalctl -u nginx              # Logs for nginx service
journalctl -u nginx -f           # Follow live
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx --since "2024-01-15" --until "2024-01-16"

# Traditional log files
tail -f /var/log/syslog          # Follow system log
tail -100 /var/log/nginx/error.log  # Last 100 lines
grep "ERROR" /var/log/app.log    # Search for errors
```

### File Permissions

```bash
# View permissions
ls -l
# -rw-r--r-- 1 user group 1234 Jan 15 10:00 file.txt
# │└┬┘└┬┘└┬┘
# │ │  │  └── Others: read only
# │ │  └───── Group: read only
# │ └──────── Owner: read + write
# └────────── File type (- = file, d = directory)

# Change permissions
chmod 755 script.sh         # rwxr-xr-x (owner all, others read+execute)
chmod 644 config.yaml       # rw-r--r-- (owner read+write, others read)
chmod +x script.sh          # Add execute permission

# Change ownership
chown user:group file.txt
chown -R user:group /app    # Recursive
```

### Network Debugging

```bash
# Check listening ports
netstat -tlnp               # TCP listeners with process info
ss -tlnp                    # Modern alternative

# Test connectivity
curl -I http://localhost:8000/health    # HTTP headers
curl -v http://localhost:8000/health    # Verbose
nc -zv hostname 5432                     # Test TCP port
ping -c 4 google.com                     # ICMP ping

# DNS lookup
nslookup example.com
dig example.com
```

---

## Debugging Scenarios

### Scenario 1: Backend Pod is Failing

```bash
# 1. Check pod status
kubectl get pods
# NAME                      READY   STATUS             RESTARTS   AGE
# backend-xxx-yyy           0/1     CrashLoopBackOff   5          10m

# 2. Check events
kubectl describe pod backend-xxx-yyy
# Look at Events section for errors

# 3. Check logs
kubectl logs backend-xxx-yyy
kubectl logs backend-xxx-yyy --previous  # If container crashed

# 4. Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
# - OOMKilled (out of memory)
```

### Scenario 2: High CPU Usage

```bash
# 1. Identify the process
top
# Press 'P' to sort by CPU

# 2. Get more details
ps aux | grep <PID>
ps -p <PID> -o %cpu,%mem,cmd

# 3. Check what it's doing
strace -p <PID>             # System calls
lsof -p <PID>               # Open files

# 4. For Python apps
py-spy top --pid <PID>      # Python profiler
```

### Scenario 3: Disk Full

```bash
# 1. Check disk usage
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1       100G   98G    2G  98% /

# 2. Find large directories
du -h --max-depth=1 / | sort -hr | head -10

# 3. Common culprits
du -sh /var/log             # Logs
du -sh /var/cache           # Caches
du -sh /tmp                 # Temp files
docker system df            # Docker images/containers

# 4. Clean up
sudo journalctl --vacuum-size=500M   # Clean old logs
docker system prune -a               # Clean Docker
```

### Scenario 4: Service Not Responding

```bash
# 1. Check if process is running
ps aux | grep myapp
systemctl status myapp

# 2. Check if port is listening
ss -tlnp | grep 8000
netstat -tlnp | grep 8000

# 3. Test locally
curl http://localhost:8000/health

# 4. Check logs for errors
journalctl -u myapp -n 100
tail -100 /var/log/myapp/error.log

# 5. Check resources
free -h                     # Memory
df -h                       # Disk
```

---

## Quick Reference Card

### File Operations
```bash
ls -la                      # List with details
cat file.txt                # View file
less file.txt               # Page through file
head -20 file.txt           # First 20 lines
tail -20 file.txt           # Last 20 lines
tail -f file.txt            # Follow live
grep "pattern" file.txt     # Search in file
find /path -name "*.log"    # Find files
```

### Process Operations
```bash
ps aux                      # All processes
top / htop                  # Interactive viewer
kill <PID>                  # Terminate gracefully
kill -9 <PID>               # Force kill
pkill -f "python app"       # Kill by name pattern
```

### System Info
```bash
uname -a                    # Kernel info
hostname                    # Machine name
uptime                      # System uptime
free -h                     # Memory usage
df -h                       # Disk usage
cat /etc/os-release         # OS version
```

### Service Management (systemd)
```bash
systemctl status nginx      # Check status
systemctl start nginx       # Start service
systemctl stop nginx        # Stop service
systemctl restart nginx     # Restart service
systemctl enable nginx      # Start on boot
systemctl disable nginx     # Don't start on boot
```

---

## Interview Debugging Walkthrough

### "Backend pod is failing — how do you debug?"

> "First, I'd check the pod status with `kubectl get pods` to see if it's CrashLoopBackOff or ImagePullBackOff. Then `kubectl describe pod` to see events - this often shows the immediate cause like missing secrets or failed health checks.
>
> Next, I'd check logs with `kubectl logs` - and `--previous` if the container already crashed. Common issues are database connection errors, missing env vars, or the app crashing on startup.
>
> If logs don't show anything, I might exec into the pod (if it's running) with `kubectl exec -it` and check things like network connectivity to dependencies, disk space, or memory usage."

---

## Shell Scripting Basics

### Script Structure

```bash
#!/bin/bash
# Shebang tells system which interpreter to use

# Variables (no spaces around =)
NAME="experiment-tracker"
VERSION=1.0
LOG_DIR="/var/log/${NAME}"

# Command substitution
TIMESTAMP=$(date +%Y-%m-%d)
POD_COUNT=$(kubectl get pods | wc -l)

# Arrays
SERVICES=("backend" "frontend" "worker")
echo "First service: ${SERVICES[0]}"
echo "All services: ${SERVICES[@]}"
```

### Conditionals

```bash
# File tests
if [ -f "/etc/config.yaml" ]; then
    echo "Config exists"
elif [ -d "/etc/config.d" ]; then
    echo "Config directory exists"
else
    echo "No config found"
fi

# String comparisons
if [ "$ENV" = "production" ]; then
    echo "Production mode"
fi

# Numeric comparisons
if [ "$COUNT" -gt 10 ]; then
    echo "Count is greater than 10"
fi

# Common test operators
# -f file    File exists and is regular file
# -d dir     Directory exists
# -z string  String is empty
# -n string  String is not empty
# -eq        Equal (numbers)
# -ne        Not equal (numbers)
# -gt        Greater than
# -lt        Less than
# =          Equal (strings)
# !=         Not equal (strings)
```

### Loops

```bash
# For loop
for service in backend frontend worker; do
    echo "Checking $service..."
    systemctl status $service
done

# Loop through array
for svc in "${SERVICES[@]}"; do
    kubectl rollout status deployment/$svc
done

# While loop
while [ "$READY" != "true" ]; do
    READY=$(kubectl get pod $POD -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    sleep 5
done

# Read file line by line
while IFS= read -r line; do
    echo "Processing: $line"
done < input.txt
```

### Functions

```bash
# Function definition
check_health() {
    local service=$1
    local port=$2

    if curl -sf "http://localhost:$port/health" > /dev/null; then
        echo "✓ $service is healthy"
        return 0
    else
        echo "✗ $service is unhealthy"
        return 1
    fi
}

# Call function
check_health "backend" 8000
check_health "frontend" 3000

# Capture return value
if check_health "api" 8080; then
    echo "API ready"
fi
```

### Error Handling

```bash
#!/bin/bash
set -e          # Exit on any error
set -u          # Error on undefined variables
set -o pipefail # Catch errors in pipelines

# Trap for cleanup
cleanup() {
    echo "Cleaning up..."
    rm -f /tmp/lockfile
}
trap cleanup EXIT

# Error handling function
die() {
    echo "ERROR: $1" >&2
    exit 1
}

# Usage
[ -f config.yaml ] || die "Config file not found"
```

### Practical Script: Health Check

```bash
#!/bin/bash
set -euo pipefail

SERVICES=("backend:8000" "frontend:3000" "worker:8001")
FAILED=0

for entry in "${SERVICES[@]}"; do
    name="${entry%%:*}"
    port="${entry##*:}"

    if curl -sf --connect-timeout 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✓ $name (port $port) - healthy"
    else
        echo "✗ $name (port $port) - UNHEALTHY"
        FAILED=$((FAILED + 1))
    fi
done

exit $FAILED
```

---

## Memory Management

### Understanding Memory

```bash
# Memory overview
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi        8.2Gi       1.1Gi       512Mi        6.1Gi        6.5Gi
# Swap:          2.0Gi       128Mi       1.9Gi

# Key columns:
# total     - Total physical RAM
# used      - Memory in use by applications
# free      - Completely unused memory
# shared    - Memory used by tmpfs
# buff/cache - Disk cache (can be reclaimed)
# available - Memory available for new apps (free + reclaimable cache)
```

### Process Memory

```bash
# Memory by process
ps aux --sort=-%mem | head -10

# Detailed memory for specific process
cat /proc/<PID>/status | grep -E "Vm|Rss"
# VmPeak:    Peak virtual memory size
# VmSize:    Current virtual memory size
# VmRSS:     Resident Set Size (actual RAM used)
# VmSwap:    Swap space used

# Memory map of a process
pmap -x <PID>
```

### Memory Issues

```bash
# Check for OOM kills
dmesg | grep -i "out of memory"
journalctl -k | grep -i "oom"

# Check swap usage
swapon --show
cat /proc/swaps

# Clear caches (use carefully)
sync
echo 1 > /proc/sys/vm/drop_caches  # Page cache
echo 2 > /proc/sys/vm/drop_caches  # Dentries and inodes
echo 3 > /proc/sys/vm/drop_caches  # All
```

### Memory Troubleshooting

| Symptom | Check | Action |
|---------|-------|--------|
| High memory usage | `free -h`, `top` sorted by %MEM | Identify memory-hungry processes |
| OOM kills | `dmesg \| grep oom` | Increase limits or add swap |
| Slow performance | `vmstat 1` | Check si/so (swap in/out) |
| Memory leak | `pmap -x <PID>` over time | Profile application |

---

## Advanced Networking

### TCP/IP Stack

```
┌─────────────────────────────────────────┐
│            APPLICATION                   │
│         (HTTP, SSH, DNS)                │
├─────────────────────────────────────────┤
│            TRANSPORT                     │
│           (TCP, UDP)                     │
├─────────────────────────────────────────┤
│            NETWORK                       │
│           (IP, ICMP)                     │
├─────────────────────────────────────────┤
│           DATA LINK                      │
│        (Ethernet, WiFi)                  │
├─────────────────────────────────────────┤
│           PHYSICAL                       │
│     (Cables, Radio waves)               │
└─────────────────────────────────────────┘
```

### Network Configuration

```bash
# View interfaces
ip addr show
ip link show

# View routing table
ip route show
# default via 192.168.1.1 dev eth0
# 192.168.1.0/24 dev eth0 proto kernel src 192.168.1.100

# Add/remove routes
ip route add 10.0.0.0/8 via 192.168.1.254
ip route del 10.0.0.0/8

# View ARP cache
arp -a
ip neigh show
```

### Network Debugging Tools

```bash
# Trace network path
traceroute google.com
mtr google.com              # Better (continuous)

# Capture packets
tcpdump -i eth0 port 80
tcpdump -i any -w capture.pcap
tcpdump -i eth0 host 192.168.1.100

# Analyze traffic
ss -s                       # Socket statistics summary
ss -tlnp                    # TCP listeners
ss -tunap                   # All TCP/UDP with process

# Check network connections
netstat -ant                # All TCP connections
lsof -i :8000               # What's using port 8000
```

### Firewall (iptables)

```bash
# List rules
iptables -L -n -v
iptables -L -t nat          # NAT table

# Common operations
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -j DROP   # Drop everything else

# Save/restore rules
iptables-save > /etc/iptables.rules
iptables-restore < /etc/iptables.rules

# Modern alternative: nftables
nft list ruleset
```

### DNS Troubleshooting

```bash
# Query DNS
dig example.com
dig example.com +short      # Just the answer
dig @8.8.8.8 example.com    # Query specific server
dig example.com MX          # Query MX records
dig example.com ANY         # All records

# Reverse lookup
dig -x 8.8.8.8

# Check DNS resolution
nslookup example.com
host example.com

# Trace DNS resolution
dig example.com +trace
```

---

## Text Processing

### grep - Pattern Search

```bash
# Basic search
grep "error" /var/log/syslog
grep -i "error"             # Case insensitive
grep -r "TODO" ./           # Recursive
grep -n "pattern" file      # Show line numbers
grep -c "pattern" file      # Count matches
grep -v "pattern" file      # Invert (exclude)
grep -l "pattern" *.log     # List files only

# Extended regex
grep -E "error|warning" file
grep -E "^[0-9]{4}-" file   # Lines starting with year

# Context
grep -B 3 "error" file      # 3 lines before
grep -A 3 "error" file      # 3 lines after
grep -C 3 "error" file      # 3 lines before and after

# Practical examples
grep -E "HTTP/1\.[01]\" [45][0-9]{2}" access.log  # HTTP errors
```

### sed - Stream Editor

```bash
# Substitution
sed 's/old/new/' file           # First occurrence per line
sed 's/old/new/g' file          # All occurrences
sed -i 's/old/new/g' file       # In-place edit

# Delete lines
sed '/pattern/d' file           # Delete matching lines
sed '1d' file                   # Delete first line
sed '1,10d' file                # Delete lines 1-10

# Insert/append
sed '2i\New line' file          # Insert before line 2
sed '2a\New line' file          # Append after line 2

# Multiple commands
sed -e 's/a/b/' -e 's/c/d/' file

# Practical examples
sed -i 's/localhost/prod-db.internal/g' config.yaml
sed -n '/START/,/END/p' file    # Print range
```

### awk - Pattern Processing

```bash
# Print columns
awk '{print $1, $3}' file       # Print 1st and 3rd columns
awk -F: '{print $1}' /etc/passwd # Custom delimiter

# Filtering
awk '$3 > 100' file             # Rows where col 3 > 100
awk '/error/' file              # Rows matching pattern

# Calculations
awk '{sum += $1} END {print sum}' file
awk '{sum += $1} END {print sum/NR}' file  # Average

# Practical examples
# Sum response times from log
awk '{sum += $NF} END {print "Total:", sum, "Avg:", sum/NR}' access.log

# Count HTTP status codes
awk '{count[$9]++} END {for (c in count) print c, count[c]}' access.log

# Format output
ps aux | awk '{printf "%-10s %5s %5s\n", $1, $3, $4}'
```

### Combining Tools

```bash
# Parse Apache logs - find top IPs with 500 errors
grep " 500 " access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Find large log files and their sizes
find /var/log -name "*.log" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr

# Extract and count unique error types
grep -h ERROR /var/log/*.log | sed 's/.*ERROR: //' | sort | uniq -c | sort -rn
```

---

## User & Group Management

### Users

```bash
# View users
cat /etc/passwd
# username:x:UID:GID:comment:home:shell

# Current user info
id
whoami
groups

# Add user
useradd -m -s /bin/bash -G docker,sudo newuser
passwd newuser

# Modify user
usermod -aG docker existinguser  # Add to group
usermod -s /bin/zsh user         # Change shell

# Delete user
userdel -r olduser               # -r removes home dir
```

### Groups

```bash
# View groups
cat /etc/group
groups username

# Create group
groupadd developers

# Add user to group
usermod -aG developers user

# Remove from group
gpasswd -d user groupname
```

### sudo Configuration

```bash
# Edit sudoers (always use visudo)
visudo

# Common entries
username ALL=(ALL:ALL) ALL                    # Full sudo access
%developers ALL=(ALL) /usr/bin/docker         # Group can run docker
username ALL=(ALL) NOPASSWD: /usr/bin/systemctl  # No password for specific command
```

---

## Cron & Scheduled Tasks

### Cron Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * * command to execute
```

### Crontab Management

```bash
# Edit current user's crontab
crontab -e

# List crontabs
crontab -l

# Common patterns
0 * * * *     # Every hour at :00
*/15 * * * *  # Every 15 minutes
0 2 * * *     # Daily at 2:00 AM
0 0 * * 0     # Weekly on Sunday
0 0 1 * *     # Monthly on 1st
```

### Example Crontabs

```bash
# Backup database daily at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1

# Rotate logs weekly
0 0 * * 0 /usr/sbin/logrotate /etc/logrotate.conf

# Health check every 5 minutes
*/5 * * * * curl -sf http://localhost:8000/health || systemctl restart myapp

# Clean temp files daily
0 3 * * * find /tmp -type f -mtime +7 -delete
```

### Systemd Timers (Modern Alternative)

```bash
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target

# /etc/systemd/system/backup.service
[Unit]
Description=Database Backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup-db.sh

# Enable timer
systemctl enable backup.timer
systemctl start backup.timer
systemctl list-timers
```

---

## Interview Scenarios

### "Walk me through debugging a slow application"

> "First, I'd identify if it's CPU, memory, I/O, or network bound using `top` and `vmstat`. For CPU-bound, I'd use `perf` or `py-spy` to profile. For I/O, check `iostat` and `iotop`.
>
> I'd look at application logs for slow queries or timeouts. For database issues, I'd check connection pool usage and query execution times.
>
> If it's network-related, I'd use `ss` to check connection states, `tcpdump` for packet analysis, and verify DNS resolution isn't slow."

### "How do you secure a Linux server?"

> "Start with SSH hardening - disable root login, use key-based auth only, change default port. Configure firewall with iptables or ufw to allow only necessary ports.
>
> Keep system updated with security patches. Set up fail2ban for brute force protection. Configure proper file permissions and use principle of least privilege for users.
>
> Enable audit logging with auditd. For production, I'd also consider SELinux or AppArmor for mandatory access control."

### "Explain the difference between processes and threads"

> "A process is an independent execution unit with its own memory space, file descriptors, and resources. Creating a process (fork) is expensive because it copies all memory.
>
> Threads are lightweight units within a process that share the same memory and resources. They're cheaper to create and can communicate via shared memory, but this also means they can affect each other (race conditions).
>
> In Python, threads are limited by the GIL, so we often use multiprocessing for CPU-bound tasks. In languages like Go, goroutines give us lightweight threading."

---

## System Configuration Deep Dive

### Boot Process

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. BIOS/UEFI  →  Hardware initialization, find boot device     │
├─────────────────────────────────────────────────────────────────┤
│ 2. Bootloader →  GRUB loads kernel and initramfs               │
├─────────────────────────────────────────────────────────────────┤
│ 3. Kernel     →  Hardware detection, mount root filesystem     │
├─────────────────────────────────────────────────────────────────┤
│ 4. Init       →  systemd (PID 1) starts services               │
├─────────────────────────────────────────────────────────────────┤
│ 5. Targets    →  multi-user.target or graphical.target         │
└─────────────────────────────────────────────────────────────────┘
```

```bash
# Check boot time analysis
systemd-analyze
# Startup finished in 2.5s (kernel) + 5.2s (userspace) = 7.7s

# Blame slowest services
systemd-analyze blame | head -10

# View boot chain
systemd-analyze critical-chain

# View kernel messages from boot
dmesg | less
journalctl -b    # Current boot
journalctl -b -1 # Previous boot
```

### Systemd Service Management

```bash
# Service unit file location
/etc/systemd/system/     # Custom services (highest priority)
/run/systemd/system/     # Runtime generated
/usr/lib/systemd/system/ # Package-installed services

# View service configuration
systemctl cat nginx
systemctl show nginx

# Edit service (creates override)
systemctl edit nginx
# Creates /etc/systemd/system/nginx.service.d/override.conf

# Reload after editing
systemctl daemon-reload
systemctl restart nginx
```

### Creating Custom Services

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
Environment=NODE_ENV=production
EnvironmentFile=/opt/myapp/.env
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/myapp/data

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
systemctl daemon-reload
systemctl enable myapp
systemctl start myapp
systemctl status myapp
```

### Kernel Parameters (sysctl)

```bash
# View all parameters
sysctl -a

# View specific parameter
sysctl net.ipv4.ip_forward
sysctl vm.swappiness

# Set temporarily
sysctl -w net.ipv4.ip_forward=1

# Set permanently
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p  # Reload

# Common tuning parameters
# /etc/sysctl.conf
net.core.somaxconn = 65535          # Max socket connections
net.ipv4.tcp_max_syn_backlog = 65535
vm.swappiness = 10                   # Reduce swap usage
vm.overcommit_memory = 1             # For Redis
fs.file-max = 2097152                # Max file descriptors
net.ipv4.ip_local_port_range = 1024 65535
```

### File Descriptor Limits

```bash
# View current limits
ulimit -a
ulimit -n      # Open files limit

# Per-user limits in /etc/security/limits.conf
# <user>   <type>  <item>    <value>
appuser    soft    nofile    65535
appuser    hard    nofile    65535
appuser    soft    nproc     4096
appuser    hard    nproc     4096
*          soft    core      0        # Disable core dumps

# Systemd service limits (in unit file)
[Service]
LimitNOFILE=65535
LimitNPROC=4096
```

---

## Storage and Filesystems

### Disk Partitioning and Filesystems

```bash
# List block devices
lsblk
lsblk -f     # Show filesystem types

# Disk information
fdisk -l /dev/sda
parted /dev/sda print

# Filesystem usage
df -h
df -i        # Inode usage (important for many small files)

# Create filesystem
mkfs.ext4 /dev/sdb1
mkfs.xfs /dev/sdb2

# Mount filesystem
mount /dev/sdb1 /mnt/data
mount -o ro /dev/sdb1 /mnt/readonly  # Read-only

# Persistent mount in /etc/fstab
# <device>     <mount>    <type>  <options>           <dump> <pass>
/dev/sdb1      /data      ext4    defaults,noatime    0      2
UUID=abc-123   /backup    xfs     defaults            0      2
```

### LVM (Logical Volume Manager)

```
┌─────────────────────────────────────────────────────────┐
│                 Logical Volumes (LV)                     │
│         /dev/vg0/data    /dev/vg0/logs                  │
├─────────────────────────────────────────────────────────┤
│                   Volume Group (VG)                      │
│                       vg0                                │
├─────────────────────────────────────────────────────────┤
│              Physical Volumes (PV)                       │
│         /dev/sda1        /dev/sdb1                      │
└─────────────────────────────────────────────────────────┘
```

```bash
# Create physical volumes
pvcreate /dev/sdb1 /dev/sdc1
pvdisplay

# Create volume group
vgcreate vg0 /dev/sdb1 /dev/sdc1
vgdisplay

# Create logical volume
lvcreate -L 100G -n data vg0
lvcreate -l 100%FREE -n logs vg0  # Use remaining space
lvdisplay

# Extend logical volume
lvextend -L +50G /dev/vg0/data
resize2fs /dev/vg0/data  # For ext4
xfs_growfs /dev/vg0/data # For xfs
```

### RAID Concepts

| Level | Description | Min Disks | Redundancy | Performance |
|-------|-------------|-----------|------------|-------------|
| RAID 0 | Striping | 2 | None | High read/write |
| RAID 1 | Mirroring | 2 | 1 disk | High read |
| RAID 5 | Striping + parity | 3 | 1 disk | Good read |
| RAID 10 | Mirror + stripe | 4 | 1 per mirror | High both |

---

## Advanced Process Management

### Process States

```
┌─────────┐     fork()     ┌─────────┐
│  New    │ ──────────────▶│  Ready  │◀──────┐
└─────────┘                └────┬────┘       │
                                │            │
                         scheduled           │ I/O complete
                                │            │
                                ▼            │
                          ┌─────────┐   ┌────┴────┐
                          │ Running │──▶│ Waiting │
                          └────┬────┘   └─────────┘
                               │
                          exit()
                               │
                               ▼
                          ┌─────────┐
                          │ Zombie  │──▶ Reaped by parent
                          └─────────┘
```

```bash
# Process states in ps output
# R - Running
# S - Sleeping (interruptible)
# D - Disk sleep (uninterruptible)
# Z - Zombie
# T - Stopped

ps aux | awk '$8 ~ /D/ {print}'  # Find D-state processes
ps aux | awk '$8 ~ /Z/ {print}'  # Find zombies
```

### Signals

| Signal | Number | Default Action | Description |
|--------|--------|----------------|-------------|
| SIGHUP | 1 | Terminate | Hangup / reload config |
| SIGINT | 2 | Terminate | Interrupt (Ctrl+C) |
| SIGQUIT | 3 | Core dump | Quit (Ctrl+\) |
| SIGKILL | 9 | Terminate | Force kill (uncatchable) |
| SIGTERM | 15 | Terminate | Graceful termination |
| SIGSTOP | 19 | Stop | Pause process (uncatchable) |
| SIGCONT | 18 | Continue | Resume stopped process |
| SIGUSR1 | 10 | Terminate | User-defined |
| SIGUSR2 | 12 | Terminate | User-defined |

```bash
# Send signals
kill -SIGHUP <PID>    # Reload config (many daemons)
kill -SIGUSR1 <PID>   # Custom (e.g., log rotation)
killall -SIGTERM nginx

# Trap signals in scripts
trap 'echo "Caught SIGINT"; cleanup; exit' SIGINT SIGTERM
```

### Process Priority and Scheduling

```bash
# View nice values (-20 highest to 19 lowest priority)
ps -eo pid,ni,comm | head

# Start with nice value
nice -n 10 ./batch-job.sh

# Change running process priority
renice -n 5 -p <PID>
renice -n -5 -u username  # All user's processes

# Real-time scheduling (use carefully)
chrt -f 50 ./realtime-app  # FIFO scheduler, priority 50
chrt -r 50 ./realtime-app  # Round-robin scheduler
```

### Process Namespaces and Cgroups

```bash
# View process namespaces
ls -la /proc/<PID>/ns/

# Common namespaces:
# - mnt   : Mount points
# - pid   : Process IDs
# - net   : Network stack
# - ipc   : Inter-process communication
# - uts   : Hostname
# - user  : User/group IDs

# View cgroup limits
cat /sys/fs/cgroup/memory/docker/<container-id>/memory.limit_in_bytes
cat /sys/fs/cgroup/cpu/docker/<container-id>/cpu.cfs_quota_us

# These are what Docker/K8s use for resource limits
```

---

## Performance Analysis Tools

### CPU Analysis

```bash
# Overall CPU stats
mpstat -P ALL 1        # Per-CPU stats every 1 second
vmstat 1               # Virtual memory and CPU

# Per-process CPU
pidstat 1              # All processes
pidstat -p <PID> 1     # Specific process

# CPU profiling
perf top                        # Live sampling
perf record -p <PID> sleep 30   # Record 30 seconds
perf report                     # Analyze recording

# Flame graphs (advanced)
perf record -g -p <PID> sleep 30
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

### I/O Analysis

```bash
# Disk I/O statistics
iostat -x 1            # Extended stats every 1 second

# Key columns:
# %util   - Device utilization (100% = saturated)
# await   - Average I/O wait time (ms)
# r/s, w/s - Reads/writes per second

# Per-process I/O
iotop                  # Interactive I/O top
pidstat -d 1           # Disk stats per process

# File system latency
biolatency-bpfcc       # BPF-based (if available)
```

### Network Analysis

```bash
# Bandwidth monitoring
iftop                  # Per-connection bandwidth
nethogs                # Per-process bandwidth
nload                  # Interface bandwidth graph

# Connection analysis
ss -s                  # Socket summary
ss -ant | awk '{print $1}' | sort | uniq -c
# Count connections by state

# Packet analysis
tcpdump -i eth0 -c 100 -w capture.pcap
tcpdump -i eth0 'port 80 and host 10.0.0.1'
wireshark capture.pcap  # GUI analysis
```

### System-Wide Analysis

```bash
# Quick system overview
vmstat 1 5
# procs  memory      swap      io     system      cpu
# r  b   swpd   free  si  so  bi  bo   in   cs  us sy id wa
# 1  0      0  15000   0   0   5  10  100  200  10  5 85  0

# Key metrics:
# r  - Runnable processes (waiting for CPU)
# b  - Blocked processes (waiting for I/O)
# si/so - Swap in/out (should be 0)
# wa - I/O wait percentage

# System activity report
sar -u 1 10   # CPU
sar -r 1 10   # Memory
sar -d 1 10   # Disk
sar -n DEV 1 10  # Network
```

---

## Troubleshooting Toolkit

### strace - System Call Tracing

```bash
# Trace system calls
strace ls                       # Run and trace
strace -p <PID>                 # Attach to running process
strace -f -p <PID>              # Follow child processes

# Filter by syscall type
strace -e open,read,write ls    # Only file operations
strace -e network ls            # Only network calls

# Timing information
strace -T ls                    # Time spent in each call
strace -c ls                    # Summary statistics

# Common patterns to look for:
# - open() returning -1 ENOENT (file not found)
# - connect() hanging (network issues)
# - read() returning 0 (EOF unexpectedly)
```

### lsof - List Open Files

```bash
# All open files by process
lsof -p <PID>

# Files in directory
lsof +D /var/log

# Network connections
lsof -i                    # All network
lsof -i :80                # Port 80
lsof -i TCP                # TCP only
lsof -i @192.168.1.100     # Connections to host

# Find who's using a file
lsof /var/log/syslog
fuser /var/log/syslog

# Find deleted but open files (disk space issue)
lsof | grep deleted
```

### /proc Filesystem

```bash
# Process information
cat /proc/<PID>/cmdline    # Command line
cat /proc/<PID>/environ    # Environment variables
cat /proc/<PID>/status     # Status and memory
cat /proc/<PID>/fd         # File descriptors
cat /proc/<PID>/maps       # Memory mappings

# System information
cat /proc/cpuinfo          # CPU details
cat /proc/meminfo          # Memory details
cat /proc/loadavg          # Load averages
cat /proc/uptime           # Uptime in seconds
cat /proc/version          # Kernel version

# Live tuning (write to change)
echo 1 > /proc/sys/net/ipv4/ip_forward
```

### Common Debugging Scenarios

#### Scenario: Application Won't Start

```bash
# 1. Check if already running
pgrep -a myapp
ss -tlnp | grep 8000

# 2. Try running manually
./myapp 2>&1 | tee debug.log

# 3. Check dependencies
ldd /path/to/myapp | grep "not found"

# 4. Check permissions
ls -la /path/to/myapp
ls -la /var/log/myapp/

# 5. Check config files
cat /etc/myapp/config.yaml
```

#### Scenario: High Load Average

```bash
# 1. Check what's in CPU/IO wait
uptime  # Load average
ps aux --sort=-%cpu | head -5
ps aux --sort=-%mem | head -5

# 2. Check for D-state processes (IO wait)
ps aux | awk '$8 ~ /D/'

# 3. Check disk I/O
iostat -x 1 3

# 4. Check for runaway processes
top -b -n 1 | head -20
```

#### Scenario: Connection Refused

```bash
# 1. Is the service running?
systemctl status myapp
ps aux | grep myapp

# 2. Is it listening?
ss -tlnp | grep 8000

# 3. Firewall blocking?
iptables -L -n | grep 8000
ufw status

# 4. SELinux/AppArmor?
getenforce
ausearch -m AVC -ts recent

# 5. Test locally
curl -v http://localhost:8000/health
```

---

## Security Hardening

### SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deploy admin

# Restart SSH
systemctl restart sshd

# Test before disconnecting!
ssh -T user@host
```

### Firewall with UFW

```bash
# Enable firewall
ufw enable
ufw default deny incoming
ufw default allow outgoing

# Allow specific ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Allow from specific IP
ufw allow from 10.0.0.0/8 to any port 5432

# View rules
ufw status verbose

# Logging
ufw logging on
tail -f /var/log/ufw.log
```

### fail2ban - Brute Force Protection

```bash
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

# Commands
systemctl start fail2ban
fail2ban-client status
fail2ban-client status sshd
fail2ban-client set sshd unbanip 192.168.1.100
```

### Audit Logging

```bash
# Enable auditd
systemctl enable auditd
systemctl start auditd

# Add audit rules
auditctl -w /etc/passwd -p wa -k identity
auditctl -w /etc/shadow -p wa -k identity
auditctl -w /var/log/ -p wa -k logs

# Persistent rules in /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers

# Search audit logs
ausearch -k identity
ausearch -m USER_LOGIN -ts today
aureport --login
```

---

## Checkpoint Questions

- [ ] How do you find which process is using the most CPU?
  > Use `top` and press 'P' to sort by CPU, or `ps aux --sort=-%cpu | head`. For continuous monitoring, `htop` is more user-friendly.

- [ ] How do you check if a port is listening?
  > `ss -tlnp | grep <port>` or `netstat -tlnp | grep <port>`. The 't' is TCP, 'l' is listening, 'n' is numeric, 'p' shows process.

- [ ] How do you view the last 100 lines of a log file?
  > `tail -100 /path/to/file.log`. For live following, use `tail -f`. For systemd services, `journalctl -u service -n 100`.

- [ ] What's the difference between kill and kill -9?
  > `kill` sends SIGTERM (15) - graceful shutdown, process can catch and cleanup. `kill -9` sends SIGKILL - immediate termination, process cannot catch or ignore. Always try SIGTERM first.

- [ ] How do you find large files on disk?
  > `find / -type f -size +100M 2>/dev/null | head -20` or `du -h --max-depth=2 / | sort -hr | head -20` for directories.

- [ ] How would you debug a network connectivity issue?
  > Start with `ping` for basic connectivity. Use `traceroute` to find where packets stop. Check `ss -tlnp` for listeners, `iptables -L` for firewall rules, `/etc/resolv.conf` for DNS.

- [ ] What does `chmod 755` mean?
  > Owner: read+write+execute (7), Group: read+execute (5), Others: read+execute (5). In binary: 111 101 101. Common for scripts and directories.

- [ ] How do you write a bash script that exits on any error?
  > Start with `#!/bin/bash` and add `set -euo pipefail`. `-e` exits on error, `-u` errors on undefined variables, `-o pipefail` catches errors in pipes.

- [ ] What is the boot process sequence in Linux?
  > BIOS/UEFI → Bootloader (GRUB) → Kernel → Init (systemd) → Target (multi-user/graphical). Use `systemd-analyze blame` to see which services are slow.

- [ ] How do you create a custom systemd service?
  > Create a `.service` file in `/etc/systemd/system/`, define [Unit], [Service], and [Install] sections. Then `systemctl daemon-reload && systemctl enable --now myservice`.

- [ ] What's the difference between soft and hard limits in ulimit?
  > Soft limits can be increased by users up to the hard limit. Hard limits can only be increased by root. Set in `/etc/security/limits.conf`.

- [ ] How do you tune kernel parameters?
  > Use `sysctl -w param=value` for temporary changes, or add to `/etc/sysctl.conf` for persistent. Common tunings: `vm.swappiness`, `net.core.somaxconn`.

- [ ] What is LVM and why use it?
  > Logical Volume Manager provides flexible disk management. You can resize volumes, add disks, and create snapshots without unmounting. Layers: Physical Volumes → Volume Groups → Logical Volumes.

- [ ] How do you trace what system calls a process is making?
  > Use `strace -p <PID>` for running process, or `strace ./command` to run and trace. Filter with `-e open,read,write` for specific calls.

- [ ] What's the difference between SIGTERM and SIGKILL?
  > SIGTERM (15) allows graceful shutdown - process can catch it, cleanup, and exit. SIGKILL (9) is immediate termination - cannot be caught or ignored. Always try SIGTERM first.

- [ ] How do you find deleted files still holding disk space?
  > `lsof | grep deleted` shows files deleted but still open. The process holding them must close the file or be restarted to free space.

- [ ] What are namespaces and cgroups?
  > Namespaces isolate process views (PID, network, mount, user). Cgroups limit resources (CPU, memory, I/O). Docker/K8s use both for container isolation and resource limits.
