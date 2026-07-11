package com.project.StudentSharingPortal.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiSummaryService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    public String summarize(String extractedText) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

        String prompt = "Summarize the following study material content in 3 to 5 concise "
                + "sentences, focused on the key concepts a student needs to know:\n\n" + extractedText;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        Map<String, Object> responseBody;
        try {
            responseBody = restTemplate.postForObject(url, requestBody, Map.class);
        } catch (RestClientException e) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }

        return extractSummaryText(responseBody);
    }

    @SuppressWarnings("unchecked")
    private String extractSummaryText(Map<String, Object> body) {
        if (body == null) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        String text = (String) parts.get(0).get("text");
        if (text == null || text.isBlank()) {
            throw new RuntimeException("AI summary service is temporarily unavailable");
        }
        return text.trim();
    }
}
