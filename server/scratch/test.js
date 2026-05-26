import 'dotenv/config';
import { clerkClient } from '@clerk/express';

async function run() {
  console.log('Fetching users from Clerk...');
  try {
    const response = await clerkClient.users.getUserList();
    // In newer Clerk SDKs, response might be a paginated object or an array.
    // Let's inspect the first user.
    const users = response.data || response;
    console.log(`Successfully fetched ${users.length} users.`);
    if (users.length > 0) {
      const firstUser = users[0];
      console.log('First User Fields:');
      console.log('ID:', firstUser.id);
      console.log('Email Addresses:', firstUser.emailAddresses);
      console.log('First Name:', firstUser.firstName);
      console.log('Last Name:', firstUser.lastName);
      console.log('Image URL:', firstUser.imageUrl);
    }
  } catch (err) {
    console.error('Error fetching users from Clerk:', err);
  }
}

run();
