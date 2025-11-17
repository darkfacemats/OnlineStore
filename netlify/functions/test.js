export const handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "✅ Function works!",
      status: "success", 
      timestamp: new Date().toISOString()
    })
  };
}