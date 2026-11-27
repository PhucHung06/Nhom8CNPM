package com.hust.se.bluemoon.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class MoveOutRequest {
    private LocalDate moveOutDate;
}
