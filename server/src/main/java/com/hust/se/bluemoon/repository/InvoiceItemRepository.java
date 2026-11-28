package com.hust.se.bluemoon.repository;

import com.hust.se.bluemoon.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Integer> {
    List<InvoiceItem> findByInvoiceIdOrderByIdAsc(Integer invoiceId);
}
