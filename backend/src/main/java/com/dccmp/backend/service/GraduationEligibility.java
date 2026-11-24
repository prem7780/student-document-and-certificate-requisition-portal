package com.dccmp.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Alumni access starts on 1 June following the scheduled graduation month (May).
 * Uses the roll-number admission year; config overrides cover institution-specific
 * exceptions. This rule is enforced on the server, not just in React.
 */
@Service
public class GraduationEligibility {
    private static final ZoneId COLLEGE_ZONE = ZoneId.of("Asia/Kolkata");
    private final Map<String, Integer> graduationYearOverrides;

    public GraduationEligibility(
            @Value("${ALUMNI_GRADUATION_OVERRIDES:25NG1A=2028}") String overrides) {
        Map<String, Integer> parsed = new HashMap<>();
        if (overrides != null && !overrides.isBlank()) {
            for (String part : overrides.split(",")) {
                String[] values = part.trim().split("=", 2);
                if (values.length != 2 || !values[0].trim().matches("(?i)\\d{2}NG[15]A")) {
                    throw new IllegalArgumentException("Invalid alumni graduation override: " + part);
                }
                int graduationYear = Integer.parseInt(values[1].trim());
                if (graduationYear < 2000 || graduationYear > 2100) {
                    throw new IllegalArgumentException("Invalid graduation year: " + part);
                }
                parsed.put(values[0].trim().toUpperCase(Locale.ROOT), graduationYear);
            }
        }
        graduationYearOverrides = Map.copyOf(parsed);
    }

    public record Status(int graduationYear, LocalDate availableFrom,
                         boolean eligible, String message) {}

    public Status status(String rollNumber) {
        return statusOn(rollNumber, LocalDate.now(COLLEGE_ZONE));
    }

    /** Package-visible for deterministic boundary tests. */
    Status statusOn(String rollNumber, LocalDate today) {
        String roll = rollNumber == null ? "" : rollNumber.trim().toUpperCase(Locale.ROOT);
        if (!roll.matches("\\d{2}NG[15]A\\d{4}")) {
            throw WorkflowService.bad("Graduation year could not be determined. Contact Admin.");
        }
        int admissionYear = 2000 + Integer.parseInt(roll.substring(0, 2));
        int normalGraduationYear = admissionYear + (roll.charAt(4) == '5' ? 3 : 4);
        int graduationYear = graduationYearOverrides.getOrDefault(roll.substring(0, 6), normalGraduationYear);
        LocalDate eligibleFrom = LocalDate.of(graduationYear, 6, 1);
        boolean eligible = !today.isBefore(eligibleFrom);
        String message = eligible
                ? "Alumni Registration is available."
                : "Alumni Registration is available after May " + graduationYear + ".";
        return new Status(graduationYear, eligibleFrom, eligible, message);
    }

    public void requireGraduated(String rollNumber) {
        Status s = status(rollNumber);
        if (!s.eligible()) throw WorkflowService.bad(s.message());
    }
}
