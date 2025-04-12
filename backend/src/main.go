package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dlcuy22/StelleFDownloader/backend/src/downloader"
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

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for the response
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // your frontend origin
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	var req DownloadRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.URL == "" {
		json.NewEncoder(w).Encode(DownloadResponse{
			Success: false,
			Message: "Please provide the URL",
		})
		return
	}

	html, err := downloader.FetchFacebookHTML(req.URL)
	if err != nil {
		json.NewEncoder(w).Encode(DownloadResponse{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	resp := DownloadResponse{
		Success: true,
		ID:      downloader.GetVideoID(req.URL),
		Title:   downloader.GetTitle(html),
		Links:   map[string]string{},
	}

	if sd := downloader.GetSDLink(html); sd != "" {
		resp.Links["Download Low Quality(360p)"] = sd + "&dl=1"
	}
	if hd := downloader.GetHDLink(html); hd != "" {
		resp.Links["Download High Quality(720p)"] = hd + "&dl=1"
	}

	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/api/download", downloadHandler)
	fmt.Println("Server running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
