-- Update stored procedure to search by both MobileNo and WhatsAppNo
-- This allows users to find customers using either mobile number or WhatsApp number

USE mobileApp;
GO

-- =============================================
-- Update Stored Procedure: Get Customer by Mobile Number
-- Now searches both MobileNo and WhatsAppNo
-- =============================================
IF OBJECT_ID('sp_GetCustomerByMobile', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetCustomerByMobile;
GO

CREATE PROCEDURE sp_GetCustomerByMobile
    @MobileNo NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Search in both MobileNo and WhatsAppNo fields
    SELECT 
        CustomerID,
        CustomerName,
        MobileNo,
        WhatsAppNo,
        CustomerType
    FROM Customers
    WHERE MobileNo = @MobileNo 
       OR WhatsAppNo = @MobileNo;
END
GO

PRINT '✅ Stored procedure sp_GetCustomerByMobile updated successfully';
PRINT '   Now searches both MobileNo and WhatsAppNo fields';
PRINT '';

