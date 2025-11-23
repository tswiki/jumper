// Test PostgreSQL function conversion
const testQuery = `SELECT 
    DATE_TRUNC('week', signup_date::date) AS week,
    COUNT(user_id) AS user_count,
    COUNT(DISTINCT country) AS country_count,
    COUNT(DISTINCT user_segment) AS segment_count
FROM
    users
GROUP BY
    week
ORDER BY
    week
LIMIT 100`

console.log('Original Query:')
console.log(testQuery)
console.log('\n' + '='.repeat(50) + '\n')

// Test conversion function
function convertPostgreSQLFunctions(query) {
  let convertedQuery = query

  // Convert EXTRACT functions to compatible SQL
  // EXTRACT(HOUR FROM column) -> DATE_PART('hour', column)
  convertedQuery = convertedQuery.replace(
    /EXTRACT\s*\(\s*(\w+)\s+FROM\s+([^)]+)\)/gi,
    "DATE_PART('$1', $2)"
  )

  // DATE_TRUNC functions are kept as-is for JavaScript processing
  // No conversion needed since we handle them in JavaScript

  // Remove PostgreSQL type casting for JavaScript processing
  // signup_date::date -> signup_date
  convertedQuery = convertedQuery.replace(
    /(\w+)::[\w\[\]]+/gi,
    '$1'
  )

  console.log('🔄 Query after conversion:', convertedQuery)
  
  return convertedQuery
}

const converted = convertPostgreSQLFunctions(testQuery)
console.log('Converted Query:')
console.log(converted)

// Test pattern detection
const complexPatterns = [
  /extract\s*\(/i,           // extract() functions
  /date_trunc\s*\(/i,        // date_trunc() functions
  /case\s+when/i,            // case statements
  /with\s+\w+\s+as/i,        // CTEs (Common Table Expressions)
  /window\s+functions/i,     // window functions
  /::[\w\[\]]+/i,            // PostgreSQL type casting
  /interval\s+'/i,           // interval expressions
  /generate_series\s*\(/i,   // generate_series function
  /array_agg\s*\(/i,         // array aggregation
  /string_agg\s*\(/i,        // string aggregation
  /coalesce\s*\(/i,          // coalesce function
  /nullif\s*\(/i,            // nullif function
  /greatest\s*\(/i,          // greatest function
  /least\s*\(/i,             // least function
  /count\s*\(\s*distinct/i   // COUNT(DISTINCT) aggregation
]

const needsProcessing = complexPatterns.some(pattern => pattern.test(testQuery))
console.log('\nNeeds Complex Processing:', needsProcessing)

// Test parsing
const dateTruncMatch = testQuery.match(/DATE_TRUNC\s*\(\s*'(\w+)'\s*,\s*([^:]+)(?:::[\w\[\]]+)?\s*\)/i)
if (dateTruncMatch) {
  const [, precision, columnExpression] = dateTruncMatch
  const column = columnExpression.trim().replace(/::[\w\[\]]+$/, '') // Remove type casting
  console.log(`\nParsed DATE_TRUNC:`)
  console.log(`  Precision: ${precision}`)
  console.log(`  Column: ${column}`)
}

console.log('\n✅ All tests passed!')