# Day 3 - Morning: Kubernetes Concepts (2h)

## Goals
- Understand core K8s concepts
- Write sample deployment manifests
- Know how to deploy and update services
- Learn debugging and troubleshooting

---

## Why Kubernetes?

### Problems It Solves

| Without K8s | With K8s |
|-------------|----------|
| Manual scaling | Auto-scaling based on load |
| Manual restarts on failure | Self-healing containers |
| Manual deployment coordination | Rolling updates with rollback |
| Manual service discovery | Built-in DNS and load balancing |
| Manual secret management | Encrypted secrets with access control |

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CONTROL PLANE                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │    API    │  │ Scheduler │  │Controller │  │        etcd           │ │
│  │  Server   │  │           │  │  Manager  │  │   (cluster state)     │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              WORKER NODES                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐               │
│  │         NODE 1          │  │         NODE 2          │               │
│  │  ┌───────┐  ┌───────┐  │  │  ┌───────┐  ┌───────┐  │               │
│  │  │kubelet│  │kube-  │  │  │  │kubelet│  │kube-  │  │               │
│  │  │       │  │proxy  │  │  │  │       │  │proxy  │  │               │
│  │  └───────┘  └───────┘  │  │  └───────┘  └───────┘  │               │
│  │  ┌───────────────────┐ │  │  ┌───────────────────┐ │               │
│  │  │     Container     │ │  │  │     Container     │ │               │
│  │  │      Runtime      │ │  │  │      Runtime      │ │               │
│  │  └───────────────────┘ │  │  └───────────────────┘ │               │
│  └─────────────────────────┘  └─────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Control Plane Components:**
- **API Server**: All communication goes through here
- **etcd**: Distributed key-value store for cluster state
- **Scheduler**: Assigns pods to nodes
- **Controller Manager**: Maintains desired state

**Node Components:**
- **kubelet**: Ensures containers are running in pods
- **kube-proxy**: Network proxy for services
- **Container Runtime**: Docker, containerd, etc.

---

## Core Kubernetes Concepts

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLUSTER                                  │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     NODE 1      │  │     NODE 2      │  │     NODE 3      │ │
│  │                 │  │                 │  │                 │ │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │ │
│  │  │   Pod     │  │  │  │   Pod     │  │  │  │   Pod     │  │ │
│  │  │ (backend) │  │  │  │ (backend) │  │  │  │ (frontend)│  │ │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Resources

| Resource | Purpose | Analogy |
|----------|---------|---------|
| **Pod** | Smallest deployable unit (1+ containers) | A single instance of your app |
| **Deployment** | Manages Pod replicas and updates | "Keep 3 copies running" |
| **Service** | Stable network endpoint for Pods | Load balancer / DNS name |
| **ConfigMap** | External configuration | Environment variables |
| **Secret** | Sensitive configuration | Encrypted env vars |
| **Ingress** | External HTTP routing | Reverse proxy |

---

## Backend Deployment Manifest

### Deployment (`backend-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-backend
  labels:
    app: experiment-tracker
    component: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: experiment-tracker
      component: backend
  template:
    metadata:
      labels:
        app: experiment-tracker
        component: backend
    spec:
      containers:
      - name: backend
        image: myregistry/experiment-tracker-backend:v1.0.0
        ports:
        - containerPort: 8000

        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Environment variables
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: backend-config
              key: log-level

        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Key Sections Explained

**replicas: 3**
- Run 3 copies of the pod for high availability
- K8s ensures 3 are always running

**resources**
```yaml
requests:    # Minimum guaranteed
  cpu: "250m"      # 0.25 CPU cores
  memory: "256Mi"  # 256 MB RAM
limits:      # Maximum allowed
  cpu: "500m"      # 0.5 CPU cores
  memory: "512Mi"  # 512 MB RAM
```

**livenessProbe**
- "Is the container alive?"
- If it fails, K8s restarts the container

**readinessProbe**
- "Is the container ready for traffic?"
- If it fails, K8s removes from service endpoints

---

## Service Manifest

### Service (`backend-service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: experiment-tracker-backend
  labels:
    app: experiment-tracker
    component: backend
spec:
  type: ClusterIP  # Internal only
  selector:
    app: experiment-tracker
    component: backend
  ports:
  - port: 80           # Service port
    targetPort: 8000   # Container port
    protocol: TCP
```

### Service Types

| Type | Access | Use Case |
|------|--------|----------|
| `ClusterIP` | Internal only | Service-to-service |
| `NodePort` | External via node IP | Development/testing |
| `LoadBalancer` | External via cloud LB | Production public access |

---

## ConfigMap and Secrets

### ConfigMap (`config.yaml`)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
data:
  log-level: "INFO"
  cache-ttl: "300"
  feature-flags: |
    {
      "new_dashboard": true,
      "beta_features": false
    }
```

### Secret (`secret.yaml`)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData:  # Will be base64 encoded
  connection-string: "postgresql://user:password@postgres:5432/experiments"
  api-key: "super-secret-key"
```

**In Production:**
- Use external secrets management (AWS Secrets Manager, Vault)
- Never commit secrets to git
- Use sealed-secrets or external-secrets operator

---

## Frontend Deployment

### Static Frontend with Nginx

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: experiment-tracker
      component: frontend
  template:
    metadata:
      labels:
        app: experiment-tracker
        component: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry/experiment-tracker-frontend:v1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: experiment-tracker-frontend
spec:
  type: ClusterIP
  selector:
    app: experiment-tracker
    component: frontend
  ports:
  - port: 80
    targetPort: 80
```

---

## Rolling Updates & Rollbacks

### Update Strategy

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods above desired count
      maxUnavailable: 0  # Always keep all pods running
```

### What Happens During a Rolling Update

```
Initial State:
[Pod v1] [Pod v1] [Pod v1]  ← 3 pods running v1

Step 1: Create new pod
[Pod v1] [Pod v1] [Pod v1] [Pod v2]  ← New pod starting

Step 2: New pod ready, terminate old
[Pod v1] [Pod v1] [Pod v2]  ← Old pod terminated

Step 3-4: Repeat
[Pod v1] [Pod v2] [Pod v2]
[Pod v2] [Pod v2] [Pod v2]  ← All pods now v2
```

### Rollback Commands

```bash
# Check rollout history
kubectl rollout history deployment/experiment-tracker-backend

# Rollback to previous version
kubectl rollout undo deployment/experiment-tracker-backend

# Rollback to specific revision
kubectl rollout undo deployment/experiment-tracker-backend --to-revision=2

# Check rollout status
kubectl rollout status deployment/experiment-tracker-backend
```

---

## Common kubectl Commands

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f .  # Apply all yaml files in directory

# View resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get all -l app=experiment-tracker

# Describe (detailed info)
kubectl describe pod <pod-name>
kubectl describe deployment experiment-tracker-backend

# Logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>  # Follow
kubectl logs <pod-name> --previous  # Previous container

# Exec into pod
kubectl exec -it <pod-name> -- /bin/sh

# Port forward for local testing
kubectl port-forward svc/experiment-tracker-backend 8000:80
```

---

## Interview Talking Points

### "How would you deploy your service on Kubernetes?"

> "I'd create Deployment manifests for the backend and frontend, each with appropriate resource limits and health checks. The backend would have a liveness probe on /health to detect hangs and a readiness probe to control traffic routing.
>
> Services would expose them internally with ClusterIP. Database credentials would be stored in K8s Secrets, referenced as environment variables. For external access, I'd use an Ingress with TLS termination."

### "What happens during a rolling update?"

> "Kubernetes gradually replaces old pods with new ones. With my config of maxSurge=1 and maxUnavailable=0, it creates one new pod, waits for it to pass readiness checks, then terminates one old pod. This repeats until all pods are updated.
>
> If the new pods fail health checks, the rollout stops automatically, preventing bad deployments. You can rollback instantly with `kubectl rollout undo`."

---

---

## Horizontal Pod Autoscaler

### Auto-Scaling Based on Metrics

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: experiment-tracker-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### How HPA Works

```
Current CPU: 85%    Target: 70%
Current Replicas: 3

Formula: desiredReplicas = ceil(currentReplicas * (currentMetric / targetMetric))
         desiredReplicas = ceil(3 * (85 / 70)) = ceil(3.64) = 4

Action: Scale up to 4 replicas
```

---

## Ingress - External Access

### Ingress Resource

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: experiment-tracker-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - experiments.company.com
    secretName: experiments-tls
  rules:
  - host: experiments.company.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: experiment-tracker-backend
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: experiment-tracker-frontend
            port:
              number: 80
```

### Traffic Flow

```
Internet
    │
    ▼
┌─────────────────┐
│  Load Balancer  │  (Cloud provider)
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Ingress Controller│  (nginx, traefik)
│   - TLS termination
│   - Path routing
└─────────────────┘
    │
    ├──────────────────┐
    ▼                  ▼
┌─────────────┐  ┌─────────────┐
│  Backend    │  │  Frontend   │
│  Service    │  │  Service    │
└─────────────┘  └─────────────┘
```

---

## Namespaces - Multi-tenancy

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ml-experiments
  labels:
    team: ml-platform

---
# Deploy to specific namespace
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker
  namespace: ml-experiments  # Target namespace
```

```bash
# Switch namespace context
kubectl config set-context --current --namespace=ml-experiments

# View resources in namespace
kubectl get pods -n ml-experiments

# View resources across all namespaces
kubectl get pods --all-namespaces
```

---

## Debugging & Troubleshooting

### Common Issues and Solutions

| Symptom | Command | Common Causes |
|---------|---------|---------------|
| Pod not starting | `kubectl describe pod <name>` | Image pull error, insufficient resources |
| Pod crashing | `kubectl logs <pod> --previous` | App error, OOM killed |
| Service not accessible | `kubectl get endpoints <svc>` | Selector mismatch, no ready pods |
| Slow performance | `kubectl top pods` | Resource limits too low |

### Debugging Workflow

```bash
# 1. Check pod status
kubectl get pods
# NAME                     READY   STATUS             RESTARTS   AGE
# backend-6f7d9c8-xyz     0/1     CrashLoopBackOff   5          10m

# 2. Get detailed info
kubectl describe pod backend-6f7d9c8-xyz
# Look for: Events, State, Last State

# 3. Check logs
kubectl logs backend-6f7d9c8-xyz
kubectl logs backend-6f7d9c8-xyz --previous  # If crashed

# 4. Exec into running container
kubectl exec -it backend-6f7d9c8-xyz -- /bin/sh

# 5. Check service endpoints
kubectl get endpoints experiment-tracker-backend
# ENDPOINTS: 10.1.1.5:8000,10.1.1.6:8000,10.1.1.7:8000

# 6. Test service from within cluster
kubectl run debug --image=busybox -it --rm -- wget -qO- http://experiment-tracker-backend/health
```

### Common Pod States

| Status | Meaning | Action |
|--------|---------|--------|
| `Pending` | Waiting for scheduling | Check node resources, node selector |
| `ContainerCreating` | Image pulling or volume mounting | Check image name, registry access |
| `Running` | Container is running | Check if actually healthy |
| `CrashLoopBackOff` | Container crashes repeatedly | Check logs, app errors |
| `ImagePullBackOff` | Can't pull image | Check image name, registry credentials |
| `OOMKilled` | Out of memory | Increase memory limits |

---

## Resource Quotas

### Namespace-Level Limits

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: ml-experiments
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "20"
    persistentvolumeclaims: "10"
```

### LimitRange - Default Limits

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: ml-experiments
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

---

## Interview Talking Points

### "How would you deploy your service on Kubernetes?"

> "I'd create Deployment manifests for the backend and frontend, each with appropriate resource limits and health checks. The backend would have a liveness probe on /health to detect hangs and a readiness probe to control traffic routing.
>
> Services would expose them internally with ClusterIP. Database credentials would be stored in K8s Secrets, referenced as environment variables. For external access, I'd use an Ingress with TLS termination."

### "What happens during a rolling update?"

> "Kubernetes gradually replaces old pods with new ones. With my config of maxSurge=1 and maxUnavailable=0, it creates one new pod, waits for it to pass readiness checks, then terminates one old pod. This repeats until all pods are updated.
>
> If the new pods fail health checks, the rollout stops automatically, preventing bad deployments. You can rollback instantly with `kubectl rollout undo`."

### "How would you debug a pod that's not starting?"

> "First, `kubectl describe pod` to check events - look for image pull errors, insufficient resources, or scheduling failures. Then `kubectl logs` for application errors. If it's crashing, use `--previous` flag for crash logs. For running but unhealthy pods, `kubectl exec` to inspect the container directly."

---

## Persistent Storage

### PersistentVolume and PersistentVolumeClaim

```yaml
# PersistentVolumeClaim - Request for storage
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: experiment-data
  namespace: ml-experiments
spec:
  accessModes:
    - ReadWriteOnce        # RWO: Single node read-write
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 10Gi
```

### Using PVC in Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: experiment-data
      - name: config
        configMap:
          name: backend-config
```

### Access Modes

| Mode | Abbreviation | Description |
|------|--------------|-------------|
| ReadWriteOnce | RWO | Single node read-write |
| ReadOnlyMany | ROX | Multiple nodes read-only |
| ReadWriteMany | RWX | Multiple nodes read-write |

---

## Network Policies

### Restrict Traffic Between Pods

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: ml-experiments
spec:
  podSelector:
    matchLabels:
      component: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow from frontend only
  - from:
    - podSelector:
        matchLabels:
          component: frontend
    ports:
    - protocol: TCP
      port: 8000
  egress:
  # Allow to database
  - to:
    - podSelector:
        matchLabels:
          component: database
    ports:
    - protocol: TCP
      port: 5432
  # Allow DNS
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

### Traffic Flow Diagram

```
                    ┌──────────────────┐
                    │    Internet      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     Ingress      │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │ Frontend  │─────▶│  Backend  │─────▶│ Database  │
    │    Pod    │      │    Pod    │      │    Pod    │
    └───────────┘      └───────────┘      └───────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    Network Policy controls
                    which pods can communicate
```

---

## StatefulSets - Stateful Applications

### For Databases and Stateful Services

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
```

### StatefulSet vs Deployment

| Feature | Deployment | StatefulSet |
|---------|------------|-------------|
| Pod Identity | Random names (pod-xyz) | Stable names (pod-0, pod-1) |
| Scaling | Parallel | Sequential (ordered) |
| Storage | Shared or none | Per-pod persistent volumes |
| DNS | Via Service only | Stable DNS per pod |
| Use Case | Stateless apps | Databases, message queues |

---

## Jobs and CronJobs

### One-time Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: database-migration
spec:
  backoffLimit: 3        # Retry 3 times on failure
  activeDeadlineSeconds: 300  # Timeout after 5 min
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migrate
        image: myregistry/backend:v1.0.0
        command: ["python", "manage.py", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
```

### CronJob - Scheduled Tasks

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-old-experiments
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  concurrencyPolicy: Forbid  # Don't run if previous still running
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: cleanup
            image: myregistry/backend:v1.0.0
            command: ["python", "scripts/cleanup.py"]
```

---

## Pod Disruption Budgets

### Ensure Availability During Updates

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
spec:
  minAvailable: 2        # At least 2 pods must be available
  # OR: maxUnavailable: 1  # At most 1 pod can be unavailable
  selector:
    matchLabels:
      app: experiment-tracker
      component: backend
```

### Why Use PDBs?

```
Scenario: 3 replicas with PDB minAvailable: 2

Without PDB:
  Drain node → All 3 pods evicted at once → Downtime

With PDB:
  Drain node → 1 pod evicted → Wait for replacement
            → 2nd pod evicted → Wait for replacement
            → 3rd pod evicted → No downtime
```

---

## Service Accounts and RBAC

### Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: experiment-tracker-sa
  namespace: ml-experiments
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-backend
spec:
  template:
    spec:
      serviceAccountName: experiment-tracker-sa
      containers:
      - name: backend
        image: myregistry/backend:v1.0.0
```

### RBAC - Role-Based Access Control

```yaml
# Role - Namespace-scoped permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: experiment-reader
  namespace: ml-experiments
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
# RoleBinding - Grant Role to ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: experiment-reader-binding
  namespace: ml-experiments
subjects:
- kind: ServiceAccount
  name: experiment-tracker-sa
  namespace: ml-experiments
roleRef:
  kind: Role
  name: experiment-reader
  apiGroup: rbac.authorization.k8s.io
```

### RBAC Hierarchy

```
ClusterRole      →  ClusterRoleBinding  →  Cluster-wide access
    ↓
   Role          →  RoleBinding         →  Namespace access
    ↓
ServiceAccount   ←  Used by Pods
```

---

## Init Containers

### Run Setup Before Main Container

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-backend
spec:
  template:
    spec:
      initContainers:
      # Wait for database to be ready
      - name: wait-for-db
        image: busybox
        command: ['sh', '-c',
          'until nc -z postgres 5432; do echo waiting for db; sleep 2; done']
      # Run migrations
      - name: run-migrations
        image: myregistry/backend:v1.0.0
        command: ['python', 'manage.py', 'migrate']
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: connection-string
      containers:
      - name: backend
        image: myregistry/backend:v1.0.0
```

### Init Container Use Cases

| Use Case | Example |
|----------|---------|
| Wait for dependency | Check database/cache is ready |
| Run migrations | Database schema updates |
| Download config | Fetch from external service |
| Permissions | Set file permissions |

---

## ConfigMap Advanced Usage

### Mounting as Files

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://backend:8000;
      }
    }
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: nginx
        image: nginx:1.24
        volumeMounts:
        - name: config
          mountPath: /etc/nginx/conf.d
      volumes:
      - name: config
        configMap:
          name: nginx-config
```

### Environment Variables from ConfigMap

```yaml
# All keys as env vars
envFrom:
- configMapRef:
    name: app-config

# Specific keys
env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: log-level
```

---

## Affinity and Anti-Affinity

### Spread Pods Across Nodes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: experiment-tracker-backend
spec:
  template:
    spec:
      affinity:
        # Don't put multiple replicas on same node
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  component: backend
              topologyKey: kubernetes.io/hostname
        # Prefer nodes with SSD
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 50
            preference:
              matchExpressions:
              - key: node-type
                operator: In
                values:
                - ssd
```

### Affinity Types

| Type | Description |
|------|-------------|
| `requiredDuring...` | Hard requirement, won't schedule otherwise |
| `preferredDuring...` | Soft preference, will schedule elsewhere if needed |
| Node Affinity | Schedule on specific nodes |
| Pod Affinity | Schedule near other pods |
| Pod Anti-Affinity | Schedule away from other pods |

---

## Monitoring and Observability

### Resource Metrics

```bash
# View pod resource usage (requires metrics-server)
kubectl top pods
kubectl top pods --sort-by=memory
kubectl top nodes

# Get resource usage in namespace
kubectl top pods -n ml-experiments --sort-by=cpu
```

### Events and Logs

```bash
# Cluster events
kubectl get events --sort-by=.lastTimestamp
kubectl get events -n ml-experiments --field-selector type=Warning

# Aggregate logs from multiple pods
kubectl logs -l app=experiment-tracker --all-containers
kubectl logs -l app=experiment-tracker -f --max-log-requests=10

# Logs from specific container in multi-container pod
kubectl logs <pod> -c <container>
```

### Prometheus Metrics (Common Pattern)

```yaml
# Pod annotations for Prometheus scraping
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
```

---

## Advanced Debugging

### Debug Pod

```bash
# Create debug pod with network tools
kubectl run debug --image=nicolaka/netshoot -it --rm -- /bin/bash

# Inside debug pod:
curl http://experiment-tracker-backend/health
nslookup experiment-tracker-backend
tcpdump -i any port 8000
```

### Ephemeral Debug Containers

```bash
# Add debug container to running pod (K8s 1.25+)
kubectl debug -it <pod-name> --image=busybox --target=backend

# Copy pod for debugging
kubectl debug <pod-name> -it --copy-to=debug-pod --container=backend -- /bin/sh
```

### Common Debugging Commands

```bash
# Check DNS resolution
kubectl run test-dns --image=busybox -it --rm -- nslookup kubernetes.default

# Test service connectivity
kubectl run test-conn --image=curlimages/curl -it --rm -- \
  curl -v http://experiment-tracker-backend:80/health

# Check endpoints (pods behind service)
kubectl get endpoints experiment-tracker-backend

# Verify service selectors match pods
kubectl get pods -l app=experiment-tracker,component=backend
kubectl get svc experiment-tracker-backend -o yaml | grep -A 10 selector
```

---

## Helm Basics

### What is Helm?

```
Package manager for Kubernetes
- Charts = packages of K8s manifests
- Values = configuration for charts
- Releases = deployed instances
```

### Common Helm Commands

```bash
# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search charts
helm search repo postgresql

# Install chart
helm install my-postgres bitnami/postgresql \
  --set auth.postgresPassword=secret \
  --namespace ml-experiments

# List releases
helm list -n ml-experiments

# Upgrade release
helm upgrade my-postgres bitnami/postgresql \
  --set auth.postgresPassword=newsecret

# Rollback
helm rollback my-postgres 1

# Uninstall
helm uninstall my-postgres
```

### Basic Chart Structure

```
my-chart/
├── Chart.yaml          # Metadata
├── values.yaml         # Default configuration
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl    # Template helpers
```

---

## Interview Talking Points

### "How would you handle zero-downtime deployments?"

> "I'd configure rolling updates with maxSurge=1 and maxUnavailable=0, so we always have full capacity. Combined with proper readiness probes, new pods only receive traffic when healthy.
>
> I'd also use PodDisruptionBudgets to protect against accidental mass evictions. For critical updates, I might use a canary deployment - deploying to a small subset first, monitoring metrics, then proceeding with full rollout."

### "How do you handle persistent data in Kubernetes?"

> "For stateful applications like databases, I'd use StatefulSets with PersistentVolumeClaims. This gives each pod stable storage that survives restarts. The volumeClaimTemplate creates separate PVs for each replica.
>
> For shared data, I'd use ReadWriteMany volumes like NFS or cloud storage. For ephemeral data, emptyDir volumes work well for scratch space that's cleaned up when the pod dies."

### "Explain how you'd secure a Kubernetes deployment"

> "Defense in depth: NetworkPolicies to restrict pod-to-pod traffic, RBAC with least-privilege service accounts, Pod Security Standards to prevent privileged containers.
>
> For secrets, I'd use External Secrets Operator to sync from AWS Secrets Manager or Vault. Enable audit logging, use image scanning in CI/CD, and run pods as non-root users with read-only root filesystems where possible."

---

## Checkpoint Questions

Be ready to explain:

- [ ] **What's the difference between a Pod and a Deployment?**
  > Pod is the smallest deployable unit (one or more containers). Deployment manages pods—maintains desired replica count, handles rolling updates, and enables rollbacks. Never create pods directly in production.

- [ ] **Why do we have both liveness and readiness probes?**
  > Liveness: "Is the container alive?" Fails → restart container. Readiness: "Is it ready for traffic?" Fails → remove from service endpoints. A container can be alive but not ready (warming up, loading data).

- [ ] **How do resource requests differ from limits?**
  > Requests: Guaranteed minimum resources, used for scheduling decisions. Limits: Maximum resources allowed, container killed if exceeded (OOMKilled for memory). Best practice: set both, limits slightly higher than requests.

- [ ] **What's the purpose of a Service?**
  > Stable network endpoint for pods. Pods are ephemeral (IPs change), but Service provides consistent DNS name and load balancing. Types: ClusterIP (internal), NodePort (external via node), LoadBalancer (cloud LB).

- [ ] **How would you handle secrets in production?**
  > Use external secrets managers (AWS Secrets Manager, Vault) with External Secrets Operator. K8s Secrets are base64 encoded (not encrypted) by default. Enable encryption at rest. Never commit secrets to git.

- [ ] **What is a StatefulSet and when would you use it?**
  > StatefulSet is for stateful applications like databases. Provides stable network identities (pod-0, pod-1), ordered deployment/scaling, and persistent storage per pod. Use for any app that needs to know its identity or has persistent state.

- [ ] **How do you ensure high availability during node maintenance?**
  > Use PodDisruptionBudgets to set minimum available pods. Configure pod anti-affinity to spread replicas across nodes. Set proper replica counts (3+ for critical services). Use rolling updates with appropriate surge/unavailable settings.

- [ ] **What are Network Policies and why use them?**
  > Network Policies are firewall rules for pods. By default, all pods can communicate. NetworkPolicies restrict ingress/egress traffic to only what's necessary. Essential for security - limits blast radius of compromised pods.

- [ ] **How would you debug a pod that keeps crashing?**
  > Check `kubectl describe pod` for events, `kubectl logs --previous` for crash logs. Look for OOMKilled in status. Exec into running container if possible. Check resource limits, probe configurations, and dependencies.
