package com.hust.se.bluemoon.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CashPaymentRequest {
    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;
}
