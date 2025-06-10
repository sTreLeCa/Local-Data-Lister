
import app from './server';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Backend server is running and listening on http://localhost:${PORT}`);
});