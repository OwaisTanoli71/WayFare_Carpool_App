import { supabase } from './supabase'

export const sendSOSAlert = async (userId, location, type = 'danger') => {
  try {
    // In a real app, you would fetch the user's trusted contacts and send a notification 
    // or broadcast to a specific channel they are subscribed to.
    // For now, we broadcast to a general 'sos_alerts' channel.
    const channel = supabase.channel('sos_alerts')
    
    await channel.send({
      type: 'broadcast',
      event: 'sos_triggered',
      payload: {
        userId,
        location,
        type, // 'danger' for manual SOS, 'warning' for trip intelligence
        timestamp: new Date().toISOString()
      }
    })
    
    // Simulate audio metadata recording (timestamp only)
    console.log(`[SOS] Audio metadata recording started at ${new Date().toISOString()}`)
    
    return { success: true }
  } catch (error) {
    console.error('Failed to send SOS alert:', error)
    return { success: false, error }
  }
}
