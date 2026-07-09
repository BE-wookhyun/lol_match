package com.demo.matching.service;

public class InvalidLineupException extends RuntimeException {

    public InvalidLineupException(String message) {
        super(message);
    }
}
