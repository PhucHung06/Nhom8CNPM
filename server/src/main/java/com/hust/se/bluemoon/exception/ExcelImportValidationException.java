package com.hust.se.bluemoon.exception;

import com.hust.se.bluemoon.dto.UtilityImportErrorDto;
import lombok.Getter;

import java.util.List;

@Getter
public class ExcelImportValidationException extends RuntimeException {
    private final List<UtilityImportErrorDto> rowErrors;

    public ExcelImportValidationException(String message, List<UtilityImportErrorDto> rowErrors) {
        super(message);
        this.rowErrors = rowErrors;
    }
}
