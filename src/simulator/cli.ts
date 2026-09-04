import readline from 'readline';
import { orchestrator } from '../core/orchestrator.js';
import { config } from '../config/index.js';
import { repositories } from '../store/repositories/index.js';

async function runSimulator() {
  console.log(`\n================================================================`);
  console.log(`📱 WhatsApp Student Helpdesk - Local Interactive Simulator`);
  console.log(`Simulating student WhatsApp interaction with HOD assistant`);
  console.log(`================================================================`);
  console.log(`Type any message as a student. Type "exit" or "quit" to stop.`);
  console.log(`Try queries such as:`);
  console.log(`  1. "Hi"`);
  console.log(`  2. "What are HOD office hours?"`);
  console.log(`  3. "I need a bonafide certificate for my passport application"`);
  console.log(`  4. "I want to apply for medical leave"`);
  console.log(`  5. "I want to complain about harassment"`);
  console.log(`  6. "Can I talk to HOD directly?"`);
  console.log(`================================================================\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const studentPhone = '919876543210';

  const promptUser = () => {
    rl.question('🧑‍🎓 Student: ', async (input) => {
      const trimmed = input.trim();
      if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
        console.log('\nExiting simulator. Goodbye!');
        rl.close();
        process.exit(0);
      }

      if (!trimmed) {
        promptUser();
        return;
      }

      const msgId = `sim_msg_${Date.now()}`;

      try {
        const response = await orchestrator.processInboundMessage({
          providerMessageId: msgId,
          from: studentPhone,
          timestamp: new Date(),
          text: trimmed,
          type: 'text',
        });

        if (response) {
          console.log(`\n🤖 Bot Response [State: ${response.nextState}]:`);
          console.log(response.replyText);
          if (response.ctaUrl) {
            console.log(`🔗 [CTA Button]: "${response.ctaUrl.title}" -> ${response.ctaUrl.url}`);
          }
          if (response.referenceId) {
            console.log(`📋 [Tracking Ref]: ${response.referenceId}`);
          }
        }
      } catch (err: any) {
        console.error('Error during simulation:', err.message);
      }

      console.log('\n----------------------------------------------------------------');
      promptUser();
    });
  };

  promptUser();
}

runSimulator();
