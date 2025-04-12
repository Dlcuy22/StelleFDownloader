package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dlcuy22/StelleFDownloader/backend/src/downloader"
)

// Configure logger
var (
	logger *log.Logger
)

type DownloadRequest struct {
	URL string `json:"url"`
}

type DownloadResponse struct {
	Success bool              `json:"success"`
	Message string            `json:"message,omitempty"`
	ID      string            `json:"id,omitempty"`
	Title   string            `json:"title,omitempty"`
	Links   map[string]string `json:"links,omitempty"`
}

func init() {
	// Initialize logger with timestamp, filename, and line number
	logger = log.New(os.Stdout, "", log.Ldate|log.Ltime|log.Lshortfile)
	logger.Println("Logger initialized successfully")
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	requestID := fmt.Sprintf("req-%d", time.Now().UnixNano())
	logger.Printf("[%s] New download request received from %s", requestID, r.RemoteAddr)

	// Set CORS headers for the response
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // your frontend origin
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	logger.Printf("[%s] Request method: %s", requestID, r.Method)

	// Handle preflight OPTIONS request
	if r.Method == "OPTIONS" {
		logger.Printf("[%s] Handling OPTIONS preflight request", requestID)
		w.WriteHeader(http.StatusOK)
		return
	}

	// Decode request body
	var req DownloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Printf("[%s] ERROR: Failed to decode request body: %v", requestID, err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DownloadResponse{
			Success: false,
			Message: "Invalid request format",
		})
		return
	}

	logger.Printf("[%s] Received URL: %s", requestID, req.URL)

	// Validate URL
	if req.URL == "" {
		logger.Printf("[%s] ERROR: Empty URL provided", requestID)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DownloadResponse{
			Success: false,
			Message: "Please provide the URL",
		})
		return
	}

	// Fetch Facebook HTML
	logger.Printf("[%s] Fetching HTML content from URL: %s", requestID, req.URL)
	html, err := downloader.FetchFacebookHTML(req.URL)
	if err != nil {
		logger.Printf("[%s] ERROR: Failed to fetch HTML: %v", requestID, err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DownloadResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}
	logger.Printf("[%s] Successfully fetched HTML content, length: %d bytes", requestID, len(html))

	// Extract video ID and title
	videoID := downloader.GetVideoID(req.URL)
	logger.Printf("[%s] Extracted video ID: %s", requestID, videoID)

	title := downloader.GetTitle(html)
	logger.Printf("[%s] Extracted video title: %s", requestID, title)

	// Extract video links
	resp := DownloadResponse{
		Success: true,
		ID:      videoID,
		Title:   title,
		Links:   map[string]string{},
	}

	// Get SD link
	sdLink := downloader.GetSDLink(html)
	if sdLink != "" {
		downloadLink := sdLink + "&dl=1"
		resp.Links["Download Low Quality(360p)"] = downloadLink
		logger.Printf("[%s] Found SD link (360p): %s", requestID, downloadLink)
	} else {
		logger.Printf("[%s] SD link not found", requestID)
	}

	// Get HD link
	hdLink := downloader.GetHDLink(html)
	if hdLink != "" {
		downloadLink := hdLink + "&dl=1"
		resp.Links["Download High Quality(720p)"] = downloadLink
		logger.Printf("[%s] Found HD link (720p): %s", requestID, downloadLink)
	} else {
		logger.Printf("[%s] HD link not found", requestID)
	}

	// Check if we found any download links
	if len(resp.Links) == 0 {
		logger.Printf("[%s] WARNING: No download links found", requestID)
		resp.Message = "No download links could be extracted"
	}

	// Send response
	logger.Printf("[%s] Sending response: %+v", requestID, resp)
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		logger.Printf("[%s] ERROR: Failed to encode response: %v", requestID, err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	logger.Printf("[%s] Request completed successfully", requestID)
}

func main() {
	logger.Println("Starting Facebook video downloader server...")

	// Register handlers
	http.HandleFunc("/api/download", downloadHandler)

	// Start server
	serverAddr := ":8080"
	logger.Printf("Server running at http://localhost%s", serverAddr)
	logger.Printf("API endpoint available at http://localhost%s/api/download", serverAddr)

	if err := http.ListenAndServe(serverAddr, logRequest(http.DefaultServeMux)); err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}

// Middleware to log all incoming requests
func logRequest(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()

		logger.Printf("Incoming request: %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		handler.ServeHTTP(w, r)

		logger.Printf("Request completed: %s %s - took %v", r.Method, r.URL.Path, time.Since(startTime))
	})
}
