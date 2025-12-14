-- ============================================
-- Create Stored Procedures for Executive Screen Assignments
-- ============================================
-- This script creates stored procedures for managing executive screen assignments
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- 1. sp_GetExecutiveScreenAssignments
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetExecutiveScreenAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetExecutiveScreenAssignments];
GO

CREATE PROCEDURE [dbo].[sp_GetExecutiveScreenAssignments]
    @EmployeeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ScreenRoute
    FROM ExecutiveScreenAssignments
    WHERE EmployeeID = @EmployeeID
    ORDER BY ScreenRoute;
END;
GO

PRINT '✅ sp_GetExecutiveScreenAssignments created successfully';
GO

-- ============================================
-- 2. sp_SetExecutiveScreenAssignments
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_SetExecutiveScreenAssignments]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_SetExecutiveScreenAssignments];
GO

CREATE PROCEDURE [dbo].[sp_SetExecutiveScreenAssignments]
    @EmployeeID INT,
    @ScreenRoutes NVARCHAR(MAX), -- Comma-separated list of screen routes
    @ModifiedBy NVARCHAR(100) = 'System'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Delete existing assignments for this employee
        DELETE FROM ExecutiveScreenAssignments
        WHERE EmployeeID = @EmployeeID;
        
        -- Insert new assignments
        IF @ScreenRoutes IS NOT NULL AND LEN(@ScreenRoutes) > 0
        BEGIN
            -- Split comma-separated string and insert each screen route
            DECLARE @ScreenRoute NVARCHAR(100);
            DECLARE @StartPos INT = 1;
            DECLARE @CommaPos INT;
            
            WHILE @StartPos <= LEN(@ScreenRoutes)
            BEGIN
                SET @CommaPos = CHARINDEX(',', @ScreenRoutes, @StartPos);
                IF @CommaPos = 0
                    SET @CommaPos = LEN(@ScreenRoutes) + 1;
                
                SET @ScreenRoute = LTRIM(RTRIM(SUBSTRING(@ScreenRoutes, @StartPos, @CommaPos - @StartPos)));
                
                IF LEN(@ScreenRoute) > 0
                BEGIN
                    INSERT INTO ExecutiveScreenAssignments (EmployeeID, ScreenRoute, ModifiedBy, ModifiedDate)
                    VALUES (@EmployeeID, @ScreenRoute, @ModifiedBy, GETDATE());
                END
                
                SET @StartPos = @CommaPos + 1;
            END
        END
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success, 'Screen assignments updated successfully' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

PRINT '✅ sp_SetExecutiveScreenAssignments created successfully';
GO

-- ============================================
-- 3. sp_GetAllExecutivesWithScreens
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetAllExecutivesWithScreens]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetAllExecutivesWithScreens];
GO

CREATE PROCEDURE [dbo].[sp_GetAllExecutivesWithScreens]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.EmployeeID,
        e.Username,
        e.EmployeeName,
        e.ShortName,
        e.Email,
        e.MobileNo,
        e.Branch,
        e.Location,
        e.EmployeeLocation,
        e.BillerName,
        e.VoucherSeries,
        e.LastVoucherNumber,
        STUFF((
            SELECT ',' + esa.ScreenRoute
            FROM ExecutiveScreenAssignments esa
            WHERE esa.EmployeeID = e.EmployeeID
            ORDER BY esa.ScreenRoute
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS AssignedScreens
    FROM Employees e
    ORDER BY e.EmployeeName;
END;
GO

PRINT '✅ sp_GetAllExecutivesWithScreens created successfully';
GO

PRINT '';
PRINT '========================================';
PRINT 'Executive Screen Assignment Stored Procedures Created';
PRINT '========================================';
GO

