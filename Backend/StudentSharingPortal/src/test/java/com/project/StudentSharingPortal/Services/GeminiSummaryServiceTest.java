package com.project.StudentSharingPortal.Services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiSummaryServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GeminiSummaryService geminiSummaryService;

    @Test
    void summarizeReturnsTextFromGeminiResponse() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        Map<String, Object> geminiResponse = Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of(
                                "parts", List.of(Map.of("text", "  This is the summary.  "))
                        )
                ))
        );
        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenReturn(geminiResponse);

        String result = geminiSummaryService.summarize("some extracted text");

        assertEquals("This is the summary.", result);
    }

    @Test
    void summarizeThrowsWhenGeminiCallFails() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenThrow(new RestClientException("boom"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> geminiSummaryService.summarize("some extracted text"));
        assertEquals("AI summary service is temporarily unavailable", ex.getMessage());
    }

    @Test
    void summarizeThrowsWhenResponseHasNoCandidates() {
        ReflectionTestUtils.setField(geminiSummaryService, "apiKey", "test-key");
        ReflectionTestUtils.setField(geminiSummaryService, "model", "gemini-2.5-flash");

        when(restTemplate.postForObject(any(String.class), any(), eq(Map.class)))
                .thenReturn(Map.of("candidates", List.of()));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> geminiSummaryService.summarize("some extracted text"));
        assertEquals("AI summary service is temporarily unavailable", ex.getMessage());
    }
}
