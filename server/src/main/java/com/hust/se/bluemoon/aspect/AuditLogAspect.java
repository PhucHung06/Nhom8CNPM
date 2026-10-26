package com.hust.se.bluemoon.aspect;

import com.hust.se.bluemoon.entity.AuditLog;
import com.hust.se.bluemoon.entity.User;
import com.hust.se.bluemoon.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;

    @AfterReturning(value = "@annotation(logAudit)", returning = "result")
    public void logSystemAction(JoinPoint joinPoint, LogAudit logAudit, Object result) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User currentUser) {
                AuditLog audit = AuditLog.builder()
                        .user(currentUser)
                        .actionName(logAudit.action())
                        .targetTable(logAudit.targetTable())
                        .details("Executed: " + joinPoint.getSignature().getName() + " with args: " + Arrays.toString(joinPoint.getArgs()))
                        .build();

                auditLogRepository.save(audit);
                log.info("[AUDIT] Action: {} on table {} by user: {}", logAudit.action(), logAudit.targetTable(), currentUser.getUsername());
            }
        } catch (Exception e) {
            log.error("[AUDIT ERROR] Không thể ghi Audit Log: {}", e.getMessage());
        }
    }
}
