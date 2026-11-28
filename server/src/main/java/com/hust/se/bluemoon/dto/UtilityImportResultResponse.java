package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityImportResultResponse {
    private int importedCount;
    private List<String> billingPeriods;
    private List<UtilityReadingResponse> readings;
}
