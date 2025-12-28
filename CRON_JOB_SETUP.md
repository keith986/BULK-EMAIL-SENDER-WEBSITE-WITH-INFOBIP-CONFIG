# Cron Job Configuration Examples

This file contains examples for setting up the scheduled email processor with various cron services.

## Option 1: Vercel Crons (Recommended for Vercel Deployments)

### Setup
1. Update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/process-scheduled",
      "schedule": "* * * * *"
    }
  ],
  "env": {
    "CRON_SECRET": "@cron_secret"
  }
}
```

2. Add secret to Vercel:
```bash
vercel env add CRON_SECRET
# Enter your secret value
```

3. Deploy:
```bash
git push  # Triggers deployment
```

### Verify
- Check Vercel dashboard > Crons tab
- Monitor cron execution logs

---

## Option 2: EasyCron (Free, No Account Required)

### Setup
1. Visit: https://www.easycron.com/

2. Create new cron job:
   - **Execution URL:** `https://yourdomain.com/api/process-scheduled`
   - **Request Method:** POST
   - **HTTP Authentication:** Basic Auth
     - Username: `cron`
     - Password: `{your-cron-secret}`
   - **Cron Expression:** `*/1 * * * *` (Every minute)
   - **Timezone:** UTC

3. Optional Headers:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   Content-Type: application/json
   ```

### Monitor
- Dashboard shows execution history
- Email notifications on failures
- Manual trigger available

---

## Option 3: CRON-JOB.ORG (Free)

### Setup
1. Visit: https://cron-job.org/

2. Create new cronjob:
   - **URL:** `https://yourdomain.com/api/process-scheduled`
   - **Execution interval:** 1 minute
   - **Request method:** POST
   - **Custom headers:**
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     Content-Type: application/json
     ```

3. Save and activate

### Features
- 10,000 free cron jobs/month
- Email alerts on failures
- Execution logs
- JSON response validation

---

## Option 4: Local Node.js with node-cron

### Setup
1. Install dependencies:
```bash
npm install node-cron node-fetch dotenv
```

2. Create `scripts/scheduler.js`:
```javascript
require('dotenv').config();
const cron = require('node-cron');
const fetch = require('node-fetch');

const CRON_SECRET = process.env.CRON_SECRET;
const API_URL = process.env.API_URL || 'http://localhost:3000';

console.log('🕐 Scheduled Email Processor Started');
console.log(`📍 API URL: ${API_URL}`);
console.log(`⏰ Running every minute...`);

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    console.log(`[${new Date().toISOString()}] Processing scheduled emails...`);
    
    const response = await fetch(`${API_URL}/api/process-scheduled`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✓ Success: ${data.message}`);
      if (data.processed > 0) {
        console.log(`  - Processed: ${data.processed}`);
        console.log(`  - Success: ${data.successCount}`);
        console.log(`  - Failed: ${data.failureCount}`);
      }
    } else {
      console.error(`✗ Error: ${data.message}`);
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹ Shutting down scheduler...');
  process.exit(0);
});
```

3. Add to `package.json`:
```json
{
  "scripts": {
    "scheduler": "node scripts/scheduler.js"
  }
}
```

4. Run:
```bash
npm run scheduler
```

---

## Option 5: AWS Lambda with EventBridge

### Setup
1. Create Lambda function (Node.js 18):

```javascript
const https = require('https');

const CRON_SECRET = process.env.CRON_SECRET;
const API_URL = process.env.API_URL;

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(API_URL).hostname,
      path: '/api/process-scheduled',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({}));
    req.end();
  });
};
```

2. Create EventBridge rule:
   - **Pattern:** Cron expression: `cron(* * * * ? *)`
   - **Target:** Your Lambda function
   - **Rate:** 1 minute

3. Set environment variables:
   - `CRON_SECRET`: Your secret
   - `API_URL`: Your domain

---

## Option 6: GitHub Actions (Free)

### Setup
1. Create `.github/workflows/schedule-emails.yml`:

```yaml
name: Process Scheduled Emails

on:
  schedule:
    - cron: '*/1 * * * *'  # Every minute

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process scheduled emails
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.API_URL }}/api/process-scheduled"
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          API_URL: ${{ secrets.API_URL }}
```

2. Add secrets to GitHub:
   - `CRON_SECRET`: Your secret
   - `API_URL`: Your domain

3. Commit and push - workflow runs automatically

---

## Option 7: Docker Container with cron

### Setup
1. Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install cron
RUN apk add --no-cache dcron

# Copy crontab
COPY crontab /etc/crontabs/root

# Install curl for API calls
RUN apk add --no-cache curl

# Start cron daemon
CMD ["crond", "-f", "-l", "2"]
```

2. Create `crontab`:

```cron
* * * * * curl -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${API_URL}/api/process-scheduled"
```

3. Build and run:

```bash
docker build -t email-scheduler .
docker run -e CRON_SECRET=your-secret \
           -e API_URL=https://yourdomain.com \
           email-scheduler
```

---

## Recommended Setup by Hosting Platform

| Platform | Recommended Solution | Ease | Cost |
|----------|-------------------|------|------|
| Vercel | Vercel Crons | ⭐⭐ | Free |
| AWS | EventBridge + Lambda | ⭐⭐⭐ | Free tier |
| Heroku | GitHub Actions | ⭐⭐ | Free |
| Self-hosted | node-cron | ⭐ | Free |
| Docker | Built-in cron | ⭐⭐⭐ | Free |
| Any | EasyCron/CRON-JOB | ⭐⭐ | Free |

---

## Testing Your Cron Setup

### 1. Manual Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://yourdomain.com/api/process-scheduled
```

### 2. Check Firestore
- Visit Firebase Console > Firestore
- Check `scheduledEmails` collection
- Verify status changes from "pending" to "sent"

### 3. Monitor Logs
```bash
# Vercel
vercel logs

# Local
npm run scheduler  # Watch console output

# Docker
docker logs container-name
```

### 4. Schedule Test Email
1. Go to Compose & Send
2. Schedule email 2 minutes in future
3. Wait for cron execution (check at minute boundary)
4. Verify status updated in Firestore
5. Confirm email received

---

## Troubleshooting

### Cron not executing
- [ ] Verify URL is accessible
- [ ] Check firewall/security rules
- [ ] Verify CRON_SECRET is correct
- [ ] Check API logs for errors
- [ ] Test endpoint manually with curl

### Emails not sending
- [ ] Verify SMTP credentials
- [ ] Check email logs in API
- [ ] Verify recipient addresses
- [ ] Check Firestore for errors
- [ ] Review error messages in `scheduledEmails`

### High failure rate
- [ ] Add retry logic to API
- [ ] Check SMTP rate limits
- [ ] Verify email content (no broken HTML)
- [ ] Check firewall rules
- [ ] Monitor Firestore quota

---

**Choose the setup that best fits your hosting platform and preference!**
