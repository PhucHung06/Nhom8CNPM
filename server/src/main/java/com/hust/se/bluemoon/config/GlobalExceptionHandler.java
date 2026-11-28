package com.hust.se.bluemoon.config;

import com.hust.se.bluemoon.exception.BusinessException;
import com.hust.se.bluemoon.exception.ExcelImportValidationException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private Map<String, Object> buildBody(HttpStatus status, String errorType, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("errorType", errorType);
        response.put("message", message);
        return response;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(err.getField(), err.getDefaultMessage());
        }
        String firstMessage = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "Dữ liệu nhập vào không hợp lệ";
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", firstMessage);
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Dữ liệu tham số không hợp lệ");
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ExcelImportValidationException.class)
    public ResponseEntity<Map<String, Object>> handleExcelImportValidation(ExcelImportValidationException ex) {
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", ex.getMessage());
        body.put("rowErrors", ex.getRowErrors());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest()
                .body(buildBody(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                        "Dung lượng tệp tải lên vượt quá giới hạn cho phép (tối đa 5MB)"));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException ex) {
        Map<String, Object> body = buildBody(ex.getStatus(), "BUSINESS_ERROR", ex.getMessage());
        body.put("errorCode", ex.getErrorCode());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }
        return ResponseEntity.status(status)
                .body(buildBody(status, "BUSINESS_ERROR", ex.getReason() != null ? ex.getReason() : "Yêu cầu không hợp lệ"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("[DB CONFLICT] {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildBody(HttpStatus.CONFLICT, "DATABASE_CONFLICT",
                        "Dữ liệu bị trùng lặp hoặc đang được tham chiếu ở phân hệ khác, không thể thực hiện thao tác"));
    }

    @ExceptionHandler({
            CannotGetJdbcConnectionException.class,
            DataAccessResourceFailureException.class,
            QueryTimeoutException.class
    })
    public ResponseEntity<Map<String, Object>> handleDatabaseConnectionError(DataAccessException ex) {
        log.error("[DB CONNECTION ERROR] {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(buildBody(HttpStatus.SERVICE_UNAVAILABLE, "DATABASE_ERROR",
                        "Không thể kết nối tới cơ sở dữ liệu. Vui lòng thử lại sau."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleGenericDatabaseError(DataAccessException ex) {
        log.error("[DB ERROR] {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody(HttpStatus.INTERNAL_SERVER_ERROR, "DATABASE_ERROR",
                        "Lỗi thao tác cơ sở dữ liệu. Vui lòng liên hệ quản trị viên."));
    }

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildBody(HttpStatus.FORBIDDEN, "FORBIDDEN",
                        "Bạn không có quyền thực hiện chức năng này"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildBody(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                        "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.warn("[RUNTIME ERROR] {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(buildBody(HttpStatus.BAD_REQUEST, "BUSINESS_ERROR", ex.getMessage()));
    }
}
