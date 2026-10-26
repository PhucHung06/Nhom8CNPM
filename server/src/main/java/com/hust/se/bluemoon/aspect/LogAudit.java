package com.hust.se.bluemoon.aspect;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LogAudit {
    String action();
    String targetTable();
}
