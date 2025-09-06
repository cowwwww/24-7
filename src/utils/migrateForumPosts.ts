import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const migrateForumPostsWithUserId = async () => {
  try {
    console.log('Starting forum posts migration...');
    
    const forumPostsRef = collection(db, 'forumPosts');
    const snapshot = await getDocs(forumPostsRef);
    
    let updatedCount = 0;
    const batch = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // If post doesn't have userId but has an author, we need to skip it
      // since we can't reliably map author names to user IDs
      if (!data.userId) {
        console.log(`Post "${data.title}" missing userId - this post won't send notifications`);
        
        // For now, we'll just mark these posts so we know they need manual fixing
        // In a real app, you'd have a mapping of author names to user IDs
        
        // If you want to temporarily disable notifications for posts without userId,
        // you could add a flag like this:
        /*
        const postRef = doc(db, 'forumPosts', docSnapshot.id);
        batch.push(updateDoc(postRef, {
          notificationsDisabled: true
        }));
        */
      }
    }
    
    console.log(`Migration complete. Found ${snapshot.docs.length} posts, ${updatedCount} needed updates.`);
    
    return {
      totalPosts: snapshot.docs.length,
      updatedPosts: updatedCount
    };
  } catch (error) {
    console.error('Error migrating forum posts:', error);
    throw error;
  }
};

// Function to manually add userId to a specific post (for testing)
export const addUserIdToPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'forumPosts', postId);
    await updateDoc(postRef, {
      userId: userId
    });
    console.log(`Added userId ${userId} to post ${postId}`);
  } catch (error) {
    console.error('Error adding userId to post:', error);
    throw error;
  }
};
