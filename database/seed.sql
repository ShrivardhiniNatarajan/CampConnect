-- ============================================
-- CampConnect Pincode Seed Data
-- MySQL 8.0+
-- ============================================

USE campconnect;

INSERT INTO pincode_lookup
    (pincode, latitude, longitude, district, state)
VALUES
    ('600001', 13.082700, 80.270700, 'Chennai', 'Tamil Nadu'),
    ('600020', 13.033900, 80.261900, 'Chennai', 'Tamil Nadu'),
    ('560001', 12.971600, 77.594600, 'Bengaluru Urban', 'Karnataka'),
    ('560034', 12.927900, 77.627100, 'Bengaluru Urban', 'Karnataka'),
    ('400001', 18.938800, 72.835400, 'Mumbai City', 'Maharashtra'),
    ('400050', 19.059600, 72.829500, 'Mumbai Suburban', 'Maharashtra'),
    ('110001', 28.632800, 77.219700, 'New Delhi', 'Delhi'),
    ('110016', 28.548800, 77.194700, 'South Delhi', 'Delhi'),
    ('500001', 17.385000, 78.486700, 'Hyderabad', 'Telangana'),
    ('500032', 17.440100, 78.348900, 'Rangareddy', 'Telangana'),
    ('700001', 22.572600, 88.363900, 'Kolkata', 'West Bengal'),
    ('700091', 22.586700, 88.417100, 'North 24 Parganas', 'West Bengal'),
    ('411001', 18.520400, 73.856700, 'Pune', 'Maharashtra'),
    ('380001', 23.022500, 72.571400, 'Ahmedabad', 'Gujarat'),
    ('302001', 26.912400, 75.787300, 'Jaipur', 'Rajasthan');