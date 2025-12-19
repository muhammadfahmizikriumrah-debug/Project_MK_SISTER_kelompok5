-- Check total portfolios
SELECT COUNT(*) as total_portfolios FROM portfolios;

-- Check portfolios by user
SELECT id, title, status, "isPublic", "createdAt" FROM portfolios WHERE "userId" = 'b1126c9b-206c-40d6-9ed1-07f60e41cdd1' ORDER BY "createdAt" DESC;
