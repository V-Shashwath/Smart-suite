-- ============================================
-- Create Stored Procedures in CrystalCopier Database
-- ============================================
-- This script creates all necessary stored procedures
-- Database: CrystalCopier
-- ============================================

USE CrystalCopier;
GO

-- ============================================
-- 1. sp_GetEmployeeData
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetEmployeeData]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetEmployeeData];
GO

CREATE PROCEDURE [dbo].[sp_GetEmployeeData]
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EmployeeID,
        Username,
        EmployeeName,
        ShortName,
        Email,
        MobileNo,
        Branch,
        Location,
        EmployeeLocation,
        BillerName,
        VoucherSeries,
        LastVoucherNumber,
        CreatedDate,
        ModifiedDate
    FROM Employees
    WHERE Username = @Username;
END;
GO

PRINT '✅ sp_GetEmployeeData created successfully';
GO

-- ============================================
-- 2. sp_AuthenticateEmployee
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AuthenticateEmployee]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_AuthenticateEmployee];
GO

CREATE PROCEDURE [dbo].[sp_AuthenticateEmployee]
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EmployeeID,
        Username,
        EmployeeName,
        ShortName,
        Email,
        MobileNo,
        Branch,
        Location,
        EmployeeLocation,
        BillerName,
        VoucherSeries,
        LastVoucherNumber
    FROM Employees
    WHERE LTRIM(RTRIM(Username)) = LTRIM(RTRIM(@Username))
        AND LTRIM(RTRIM(Password)) = LTRIM(RTRIM(@Password));
END;
GO

PRINT '✅ sp_AuthenticateEmployee created successfully';
GO

-- ============================================
-- 3. sp_GetCustomerByMobile
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetCustomerByMobile]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetCustomerByMobile];
GO

CREATE PROCEDURE [dbo].[sp_GetCustomerByMobile]
    @MobileNo NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        CustomerName,
        Address,
        MobileNo,
        WhatsAppNo,
        Email,
        CustomerType,
        CreatedDate,
        ModifiedDate
    FROM Customers
    WHERE (MobileNo = @MobileNo OR WhatsAppNo = @MobileNo);
END;
GO

PRINT '✅ sp_GetCustomerByMobile created successfully';
GO

-- ============================================
-- 4. sp_GetCustomerByID
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetCustomerByID]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetCustomerByID];
GO

CREATE PROCEDURE [dbo].[sp_GetCustomerByID]
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CustomerID,
        CustomerName,
        Address,
        MobileNo,
        WhatsAppNo,
        Email,
        CustomerType,
        CreatedDate,
        ModifiedDate
    FROM Customers
    WHERE CustomerID = @CustomerID;
END;
GO

PRINT '✅ sp_GetCustomerByID created successfully';
GO

-- ============================================
-- 5. sp_GetNextVoucherNumber
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetNextVoucherNumber]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetNextVoucherNumber];
GO

CREATE PROCEDURE [dbo].[sp_GetNextVoucherNumber]
    @Username NVARCHAR(100),
    @VoucherSeries NVARCHAR(50) OUTPUT,
    @VoucherNo NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @LastVoucherNumber INT;
    DECLARE @NextNumber INT;
    DECLARE @EmployeeVoucherSeries NVARCHAR(50);
    
    -- Get employee's last voucher number and series
    SELECT 
        @LastVoucherNumber = ISNULL(LastVoucherNumber, 0),
        @EmployeeVoucherSeries = ISNULL(VoucherSeries, 'ESI')
    FROM Employees
    WHERE Username = @Username;
    
    -- If employee not found, return error
    IF @LastVoucherNumber IS NULL
    BEGIN
        SET @VoucherSeries = NULL;
        SET @VoucherNo = NULL;
        RETURN;
    END
    
    -- Calculate next number
    SET @NextNumber = @LastVoucherNumber + 1;
    
    -- Update employee's last voucher number
    UPDATE Employees
    SET LastVoucherNumber = @NextNumber,
        ModifiedDate = GETDATE()
    WHERE Username = @Username;
    
    -- Set output parameters
    SET @VoucherSeries = @EmployeeVoucherSeries;
    SET @VoucherNo = CAST(@NextNumber AS NVARCHAR(50));
END;
GO

PRINT '✅ sp_GetNextVoucherNumber created successfully';
GO

-- ============================================
-- 6. sp_AuthenticateSupervisor
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AuthenticateSupervisor]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_AuthenticateSupervisor];
GO

CREATE PROCEDURE [dbo].[sp_AuthenticateSupervisor]
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Authenticate supervisor from Supervisors table in CrystalCopier database
    -- Only return active supervisors
    -- Trim whitespace from username and password for matching
    SELECT 
        SupervisorID,
        Username,
        SupervisorName,
        Email,
        MobileNo,
        Branch,
        Location,
        Status
    FROM CrystalCopier.dbo.Supervisors
    WHERE LTRIM(RTRIM(Username)) = LTRIM(RTRIM(@Username))
        AND LTRIM(RTRIM(Password)) = LTRIM(RTRIM(@Password))
        AND (Status = 'Active' OR Status IS NULL);
END;
GO

PRINT '✅ sp_AuthenticateSupervisor created successfully';
GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Stored Procedures Creation Summary';
PRINT '========================================';
PRINT 'Stored procedures created in CrystalCopier database:';
PRINT '1. sp_GetEmployeeData';
PRINT '2. sp_AuthenticateEmployee';
PRINT '3. sp_AuthenticateSupervisor';
PRINT '4. sp_GetCustomerByMobile';
PRINT '5. sp_GetCustomerByID';
PRINT '6. sp_GetNextVoucherNumber';
PRINT '========================================';
GO

