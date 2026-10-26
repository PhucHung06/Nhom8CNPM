package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.ResidenceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ResidencyLogRequest {
    @NotNull(message = "ID nhân khẩu không được để trống")
    private Integer residentId;

    @NotNull(message = "Loại biến động không được để trống")
    private ResidenceStatus logType;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    private String reason;
}
