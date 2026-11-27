package com.hust.se.bluemoon.dto;

import com.hust.se.bluemoon.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GrantAccessRequest {
    @NotNull(message = "Trạng thái duyệt không được để trống")
    private ApprovalStatus approvalStatus;

    private Integer householdId;
}
