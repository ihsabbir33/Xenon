package com.xenon.data.repository;

import com.xenon.core.domain.response.ambulance.projection.AmbulanceMetadataProjection;
import com.xenon.data.entity.ambulance.Ambulance;
import com.xenon.data.entity.ambulance.AmbulanceStatus;
import com.xenon.data.entity.ambulance.AmbulanceType;
import com.xenon.data.entity.hospital.Hospital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {
    boolean existsByAmbulanceNumber(String ambulanceNumber);

    @Query(
            value = """
            SELECT COUNT(*) AS ambulanceCount,
                   COALESCE(SUM(doctors), 0) as doctorCount
            FROM ambulance a
            WHERE a.ambulance_type = :type;
            """,
            nativeQuery = true
    )
    AmbulanceMetadataProjection getAmbulanceMetadata(@Param("type") String ambulanceType);

    List<Ambulance> findAllByAmbulanceType(AmbulanceType ambulanceType);

    Page<Ambulance> findAllByAmbulanceType(AmbulanceType ambulanceType, Pageable pageable);

    List<Ambulance> findAllByAmbulanceStatus(AmbulanceStatus status);

    Page<Ambulance> findAllByAmbulanceStatus(AmbulanceStatus status, Pageable pageable);

    List<Ambulance> findAllByAmbulanceTypeAndAmbulanceStatus(AmbulanceType type, AmbulanceStatus status);

    Page<Ambulance> findAllByAmbulanceTypeAndAmbulanceStatus(AmbulanceType type, AmbulanceStatus status, Pageable pageable);

    @Query("SELECT a FROM Ambulance a WHERE a.ambulanceType = :type AND a.ambulanceStatus = 'AVAILABLE' AND " +
            "LOWER(a.coverage_areas) LIKE LOWER(CONCAT('%', :area, '%'))")
    Page<Ambulance> findByAmbulanceTypeAndAreaContaining(
            @Param("type") AmbulanceType type,
            @Param("area") String area,
            Pageable pageable);

    @Query("SELECT AVG(ar.rating) FROM AmbulanceReview ar WHERE ar.ambulance.id = :ambulanceId")
    Double getAverageRatingByAmbulanceId(@Param("ambulanceId") Long ambulanceId);

    @Query("SELECT COUNT(ar) FROM AmbulanceReview ar WHERE ar.ambulance.id = :ambulanceId")
    Integer getReviewCountByAmbulanceId(@Param("ambulanceId") Long ambulanceId);

    Optional<Ambulance> findByUserId(Long id);


//    <T> ScopedValue<T> findByUserId(Long id);
}