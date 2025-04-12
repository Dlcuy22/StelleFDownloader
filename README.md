# StelleDownloader

An open-source Facebook downloader built with Vue and Golang.

This project includes a server backend, client web UI, and CLI tool.

## Server

The server is built with Golang using the net/http package.

**Build Instructions:**
_Requires Golang installation_
```bash
cd backend/src 
go build -o StelleBackend main.go
```
Note: Add `.exe` extension if using Windows

The server will run at `localhost:8080/api/download`

## Client Web UI

The client is built with Nuxt framework.

**Setup and Run:**
```bash
cd frontend/webui 
pnpm install 
pnpm run dev
```
The web UI will be available at `localhost:3000`

## CLI Tool

The CLI tool is built with JavaScript and the Blessed library for UI.

**Setup and Run:**
```bash
cd frontend/cli 
pnpm install 
node .
```