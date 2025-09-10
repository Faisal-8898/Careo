-- =====================================================
-- ROUTE PROCEDURES
-- =====================================================

-- Procedure to get all routes with pagination
CREATE OR REPLACE PROCEDURE GetAllRoutes(
    p_offset IN NUMBER,
    p_limit IN NUMBER,
    p_routes OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_routes FOR
        SELECT r.route_id, r.route_name, r.route_code, r.created_at,
               COUNT(rs.station_id) as station_count
        FROM Routes r
        LEFT JOIN Route_Stations rs ON r.route_id = rs.route_id
        GROUP BY r.route_id, r.route_name, r.route_code, r.created_at
        ORDER BY r.route_name
        OFFSET p_offset ROWS FETCH NEXT p_limit ROWS ONLY;
END GetAllRoutes;
/

-- Procedure to get route by ID with stations
CREATE OR REPLACE PROCEDURE GetRouteById(
    p_route_id IN NUMBER,
    p_route OUT SYS_REFCURSOR,
    p_stations OUT SYS_REFCURSOR
) AS
BEGIN
    -- Get route info
    OPEN p_route FOR
        SELECT route_id, route_name, route_code, created_at
        FROM Routes
        WHERE route_id = p_route_id;
    
    -- Get stations in route
    OPEN p_stations FOR
        SELECT rs.stop_sequence, rs.distance_km,
               s.station_id, s.station_name, s.station_code, s.city
        FROM Route_Stations rs
        JOIN Stations s ON rs.station_id = s.station_id
        WHERE rs.route_id = p_route_id
        ORDER BY rs.stop_sequence;
END GetRouteById;
/

-- Procedure to get all stations in a route
CREATE OR REPLACE PROCEDURE GetRouteStations(
    p_route_id IN NUMBER,
    p_stations OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_stations FOR
        SELECT rs.stop_sequence, rs.distance_km,
               s.station_id, s.station_name, s.station_code, s.city
        FROM Route_Stations rs
        JOIN Stations s ON rs.station_id = s.station_id
        WHERE rs.route_id = p_route_id
        ORDER BY rs.stop_sequence;
END GetRouteStations;
/

