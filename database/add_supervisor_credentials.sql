-- Add supervisor with username 'Supervisor' and password 'Admin'
-- This matches the frontend SUPERVISOR_CREDENTIALS

USE mobileApp;
GO

-- Check if supervisor with username 'Supervisor' already exists
IF NOT EXISTS (SELECT 1 FROM Supervisors WHERE Username = 'Supervisor')
BEGIN
    INSERT INTO Supervisors (SupervisorName, Username, Password, Branch, Location, Status)
    VALUES ('Main Supervisor', 'Supervisor', 'Admin', 'Head Office', 'Main Location', 'Active');
    
    PRINT 'Supervisor added successfully:';
    PRINT '  Username: Supervisor';
    PRINT '  Password: Admin';
END
ELSE
BEGIN
    -- Update existing supervisor
    UPDATE Supervisors
    SET Password = 'Admin',
        SupervisorName = 'Main Supervisor',
        ModifiedDate = GETDATE()
    WHERE Username = 'Supervisor';
    
    PRINT 'Supervisor password updated successfully:';
    PRINT '  Username: Supervisor';
    PRINT '  Password: Admin';
END
GO

-- Verify the supervisor
SELECT SupervisorID, SupervisorName, Username, Password, Status
FROM Supervisors
WHERE Username = 'Supervisor';
GO

