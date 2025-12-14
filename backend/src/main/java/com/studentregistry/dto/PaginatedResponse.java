package com.studentregistry.dto;

import java.util.List;

public class PaginatedResponse<T> {
    
    private List<T> data;
    private long total;
    private int totalPages;
    private int currentPage;
    private int limit;
    
    public PaginatedResponse() {}
    
    public PaginatedResponse(List<T> data, long total, int currentPage, int limit) {
        this.data = data;
        this.total = total;
        this.currentPage = currentPage;
        this.limit = limit;
        this.totalPages = (int) Math.ceil((double) total / limit);
    }
    
    // Static factory method to create from Spring's Page
    public static <T> PaginatedResponse<T> fromPage(org.springframework.data.domain.Page<T> page) {
        return new PaginatedResponse<>(
            page.getContent(),
            page.getTotalElements(),
            page.getNumber() + 1, // Convert 0-based to 1-based
            page.getSize()
        );
    }
    
    public List<T> getData() {
        return data;
    }
    
    public void setData(List<T> data) {
        this.data = data;
    }
    
    public long getTotal() {
        return total;
    }
    
    public void setTotal(long total) {
        this.total = total;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
    
    public int getCurrentPage() {
        return currentPage;
    }
    
    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }
    
    public int getLimit() {
        return limit;
    }
    
    public void setLimit(int limit) {
        this.limit = limit;
    }
}