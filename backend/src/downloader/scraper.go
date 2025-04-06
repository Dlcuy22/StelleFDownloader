package downloader

import (
	"errors"
	"io"
	"net/http"
	"regexp"
	"strings"
)

// Clean up strings (like PHP's cleanStr)
func cleanStr(str string) string {
	return strings.ReplaceAll(str, "\\u0025", "%")
}

// Extract HD video URL
func GetHDLink(html string) string {
	re := regexp.MustCompile(`browser_native_hd_url":"([^"]+)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return cleanStr(match[1])
	}
	return ""
}

// Extract SD video URL
func GetSDLink(html string) string {
	re := regexp.MustCompile(`browser_native_sd_url":"([^"]+)"`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return cleanStr(match[1])
	}
	return ""
}

// Extract <title>
func GetTitle(html string) string {
	re := regexp.MustCompile(`<title>(.*?)</title>`)
	match := re.FindStringSubmatch(html)
	if len(match) > 1 {
		return match[1]
	}
	return "No Title"
}

// Extract video ID
func GetVideoID(url string) string {
	re := regexp.MustCompile(`(\d+)/?$`)
	match := re.FindStringSubmatch(url)
	if len(match) > 1 {
		return match[1]
	}
	return ""
}

// Fetch HTML from Facebook
func FetchFacebookHTML(url string) (string, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	headers := map[string]string{
		"user-agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
		"accept-language": "en-US,en;q=0.9",
		"accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", errors.New("failed to fetch page")
	}

	buf := new(strings.Builder)
	_, err = io.Copy(buf, resp.Body)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}
