-- =====================================================
-- STATION PROCEDURES
-- =====================================================

-- Procedure to get all stations with pagination
CREATE OR REPLACE PROCEDURE GetAllStations(
    p_offset IN NUMBER,
    p_limit IN NUMBER,
    p_stations OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_stations FOR
        SELECT station_id, station_name, station_code, city, created_at
        FROM Stations
        ORDER BY station_name
        OFFSET p_offset ROWS FETCH NEXT p_limit ROWS ONLY;
END GetAllStations;
/

-- Procedure to get station by ID
CREATE OR REPLACE PROCEDURE GetStationById(
    p_station_id IN NUMBER,
    p_station OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_station FOR
        SELECT station_id, station_name, station_code, city, created_at
        FROM Stations
        WHERE station_id = p_station_id;
END GetStationById;
/

-- Procedure to search stations
CREATE OR REPLACE PROCEDURE SearchStations(
    p_search_term IN VARCHAR2,
    p_stations OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_stations FOR
        SELECT station_id, station_name, station_code, city, created_at
        FROM Stations
        WHERE UPPER(station_name) LIKE UPPER(p_search_term)
           OR UPPER(station_code) LIKE UPPER(p_search_term)
           OR UPPER(city) LIKE UPPER(p_search_term)
        ORDER BY station_name
        FETCH FIRST 20 ROWS ONLY;
END SearchStations;
/

