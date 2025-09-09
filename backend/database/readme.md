Data Insertion Flow
1. Stations (First - No Dependencies)
sqlINSERT INTO Stations (station_id, station_name, station_code, city)

6 stations inserted: Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Rangpur
These are independent entities with no foreign key dependencies

2. Routes (Second - No Dependencies)
sqlINSERT INTO Routes (route_id, route_name, route_code)

3 routes inserted: DHK-CTG, DHK-SYL, DHK-RAJ
Independent entities, just route definitions

3. Route_Stations (Third - Depends on Stations + Routes)
sqlINSERT INTO Route_Stations (route_id, station_id, stop_sequence, distance_km)

Links routes to stations with sequence and distance information
Dependencies: Requires both Stations and Routes to exist first

4. Trains (Fourth - Depends on Routes)
sqlINSERT INTO Trains (train_id, train_name, train_type, route_id, total_capacity, status)

4 trains inserted with route assignments
Dependencies: Requires Routes to exist (foreign key: route_id)

5. Schedules (Fifth - Depends on Trains + Stations)
sqlINSERT INTO Schedules (schedule_id, train_id, departure_station_id, arrival_station_id, ...)

3 schedules with departure/arrival times and fares
Dependencies: Requires Trains and Stations (foreign keys: train_id, departure_station_id, arrival_station_id)

6. Passengers (Sixth - No Dependencies)
sqlINSERT INTO Passengers (passenger_id, username, email, ...)

3 passenger accounts created
Independent user accounts

7. Admins (Seventh - Self-Referencing)
sqlINSERT INTO Admins (admin_id, username, email, ..., created_by)

3 admin accounts with hierarchical relationships
First admin has no creator, others reference the first admin

8. Reservations (Eighth - Depends on Passengers + Schedules)
sqlINSERT INTO Reservations (reservation_id, passenger_id, schedule_id, ...)

3 ticket reservations
Dependencies: Requires Passengers and Schedules (foreign keys: passenger_id, schedule_id)

9. Payments (Ninth - Depends on Reservations)
sqlINSERT INTO Payments (payment_id, reservation_id, amount, ...)

3 payment records for the reservations
Dependencies: Requires Reservations (foreign key: reservation_id)

Key Dependency Chain:

Stations & Routes → Route_Stations
Routes → Trains → Schedules
Passengers + Schedules → Reservations → Payments