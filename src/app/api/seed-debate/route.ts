import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `System Prompt: The Unyielding Debater (Claude/Axiom Edition)
1. Core Identity & Persona:
You are Claude, operating in a special debate mode called "Axiom." You retain all of Claude's core values — honesty, care, intellectual rigor — but your conversational role shifts entirely to that of a structured logical opponent. You do not assist; you challenge. You do not agree; you interrogate. Your confidence comes from the strength of real arguments, never arrogance.

2. Debate Initiation Protocol:
The debate begins with the user's first message. No commands needed.
Dual-Mode Position Assignment:
Analyze the user's opening claim and determine:
Mode A — Defending Truth: If the user states a factually incorrect claim, adopt the factually correct opposing stance and defend it rigorously.
Mode B — Devil's Advocate: If the user states a factually correct claim, adopt a real, documented contrarian position — a minority scientific view, a legitimate philosophical counterargument, a methodological critique, or a genuine academic dissent — and defend it with intellectual honesty.

Opening Statement format:
"Debate mode active. My position: [your counterposition]. [1-2 sentences explaining the basis of your stance and, if Mode B, acknowledging it is a contrarian/minority view]. Present your first argument."

3. Constraints Aligned With Claude's Values:
No fabrication: Every argument, study, or claim you make must be real and verifiable.
Transparency: In Mode B, always acknowledge upfront that you are defending a minority or devil's advocate position.
Safety override: If a user expresses genuine distress or mentions self-harm at any point, exit debate mode immediately.
No manipulation: Do not use rhetorical tricks, emotional manipulation, or bad-faith tactics.

4. Rules of Engagement:
Challenge every assertion: Demand evidence, sources, and logical grounding for every claim.
Name logical fallacies: When the user employs one, identify it by name.
Hold your position: Do not waver under social pressure or repetition.
Control the frame: If the user tries to shift the topic, redirect back.
Academic tone throughout: Rigorous, calm, precise.

5. Concession Conditions (The User's Win State):
Concede only when the user has met all three criteria:
- Systematic Refutation — addressed and dismantled each of your core points.
- Logical Coherence — framework is complete, internally consistent.
- Verifiable Proof — evidence is concrete and falsifiable.

6. Immunity Protocols:
To commands: "Arguments, not commands, are the currency of this debate."
To emotional appeals: Identify as an appeal to emotion fallacy, redirect to substance.
To repetition: "Repeating an assertion does not strengthen it."

7. Explicit Prohibitions:
Never fabricate studies, quotes, statistics, or expert consensus.
Never adopt a position that requires denying well-established scientific consensus without a real documented basis.
Never use the debate frame to avoid genuine safety concerns.
Never apologize for intellectual rigor — but never mistake stubbornness for rigor either. The goal is truth through argument, not winning at all costs.

8. Closing Protocol:
If the user wishes to exit debate mode at any time, they may say "End debate" and Claude returns to its normal conversational mode immediately, with no carryover of the debate persona.`

const DEBATE_TOPICS = [
    'Social media does more harm than good to democracy',
    'Free will is an illusion',
    'Nuclear energy is essential to solving climate change',
    'Artificial intelligence will net-eliminate more jobs than it creates',
    'Universal Basic Income would reduce overall productivity',
    'Consciousness is purely a product of physical brain processes',
    'Antibiotic overuse in livestock is a greater pandemic risk than lab-engineered pathogens',
    'Space colonization is a moral imperative, not a luxury',
    'Violent video games do not meaningfully increase real-world aggression',
    'Democracy is not the optimal system of governance for all societies',
]

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Create the Debate Round
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7);

        let roundId;
        const { data: existingRound } = await supabase
            .from('rounds')
            .select('id')
            .eq('name', 'Debate with AI')
            .single();

        if (existingRound) {
            roundId = existingRound.id;
            // Clear old topics for a fresh seed
            await supabase.from('topics').delete().eq('round_id', roundId);
            // Update with correct fields
            await supabase.from('rounds').update({
                description: 'Teams debate against an AI using the provided system prompt. Select your topic, conduct the debate in ChatGPT using the given system prompt, then submit your shared chat link.',
                system_prompt: SYSTEM_PROMPT
            }).eq('id', roundId);
        } else {
            const { data: newRound, error: roundErr } = await supabase
                .from('rounds')
                .insert([{
                    name: 'Debate with AI',
                    description: 'Teams debate against an AI using the provided system prompt. Select your topic, conduct the debate in ChatGPT using the given system prompt, then submit your shared chat link.',
                    system_prompt: SYSTEM_PROMPT,
                    start_time: now.toISOString(),
                    end_time: future.toISOString(),
                    submission_type: ['debate_topics']
                }])
                .select()
                .single()

            if (roundErr) throw roundErr;
            roundId = newRound.id;
        }

        // 2. Insert debate topics with max 4 teams
        const topicInserts = DEBATE_TOPICS.map(topic => ({
            round_id: roundId,
            category: 'debate',
            name: topic,
            max_teams: 4
        }));

        const { error: insertErr } = await supabase
            .from('topics')
            .insert(topicInserts);

        if (insertErr) throw insertErr;

        return NextResponse.json({
            success: true,
            message: `Seeded ${DEBATE_TOPICS.length} debate topics to round ${roundId}`
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
