package com.hust.se.bluemoon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityImportErrorDto {
    private int rowNumber;
    private String apartmentCode;
    private String serviceType;
    private String message;
}
