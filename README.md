# Blue Collar Jobs MCP

This project uses Docker Compose to orchestrate multiple services for development and deployment.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) (if not included with Docker Desktop)

## Setup & Running

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd blue-collar-jobs-mcp
   ```

2. **Configure environment variables:**
   - Environment files are located in the `envs/` directory. You can adjust them as needed for your setup.

3. **Start all services:**
   ```sh
   docker-compose up --build
   ```
   This will build and start all containers defined in `docker-compose.yaml`.

4. **Accessing Services:**
   - The services will be available on the ports defined in `docker-compose.yaml` (e.g., 3000, 3001, etc.).
   - Check the output logs for exact URLs.

5. **Stopping Services:**
   ```sh
   docker-compose down
   ```

## Troubleshooting
- Ensure no other services are running on the same ports.
- If you make changes to dependencies, use `docker-compose up --build` to rebuild images.

## Project Structure
- `backend/` - Backend services for each integration
- `frontend/` - Frontend code for each integration
- `mcp-server/` - MCP Server Implementation
- `transformation-engine/` - MCP Backend & Data Normalizer Script
- `envs/` - Environment variable files

---
For more details, refer to the individual README files in each service directory. 