import { registerAgentModule } from '../features/agents/registry';
import { emailAssistantModule } from '../features/agents/email-assistant/module';
import { receiptsModule } from '../features/agents/receipts/module';

// Composition root for agent modules. Add new agents here — the shell resolves
// them by the selected skill's name and needs no other changes.
registerAgentModule(emailAssistantModule);
registerAgentModule(receiptsModule);
