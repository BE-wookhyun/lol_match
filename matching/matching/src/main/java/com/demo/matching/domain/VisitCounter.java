package com.demo.matching.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "visit_counter")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VisitCounter {

    @Id
    private Long id;

    private long count;
}
