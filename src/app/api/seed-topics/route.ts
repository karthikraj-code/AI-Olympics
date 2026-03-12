import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Mapped directly from user's provided list
const CSE_TOPICS = [
    'Operating Systems - Process Scheduling',
    'Operating Systems - Virtual Memory',
    'Operating Systems - Threads vs Processes',
    'Computer Networks - TCP Protocol',
    'Computer Networks - DNS Resolution',
    'Computer Networks - Packet Switching',
    'Data Structures - Stack',
    'Data Structures - Queue',
    'Data Structures - Binary Trees',
    'Database Management Systems (DBMS) - SQL Joins',
    'Database Management Systems (DBMS) - Normalization',
    'Database Management Systems (DBMS) - Indexing',
    'Machine Learning - Linear Regression',
    'Machine Learning - Decision Trees',
    'Machine Learning - Model Overfitting',
    'Artificial Intelligence - Search Algorithms',
    'Artificial Intelligence - Expert Systems',
    'Artificial Intelligence - Knowledge Representation',
    'Computer Architecture - CPU Pipeline',
    'Computer Architecture - Cache Memory',
    'Computer Architecture - Instruction Set Architecture',
    'Cybersecurity - Encryption Basics',
    'Cybersecurity - Authentication Systems',
    'Cybersecurity - Hash Functions',
    'Cloud Computing - Virtual Machines',
    'Cloud Computing - Load Balancing',
    'Cloud Computing - Serverless Computing',
    'Software Engineering - Agile Development',
    'Software Engineering - Software Testing',
    'Software Engineering - Version Control',
    'Web Technologies - REST APIs',
    'Web Technologies - Session Management',
    'Web Technologies - Frontend–Backend Architecture',
    'Computer Graphics - Rendering Pipeline',
    'Computer Graphics - 3D Transformations',
    'Computer Graphics - Ray Tracing',
    'Natural Language Processing - Sentiment Analysis',
    'Natural Language Processing - Tokenization',
    'Natural Language Processing - Language Models',
    'Distributed Systems - Consensus Algorithms',
    'Distributed Systems - Fault Tolerance',
    'Distributed Systems - Distributed Databases',
    'Information Retrieval - Search Ranking',
    'Information Retrieval - Inverted Index',
    'Information Retrieval - Query Processing'
];

const OTHER_TOPICS = [
    'Mathematics - Probability',
    'Mathematics - Matrices',
    'Mathematics - Graph Theory',
    'Statistics - Mean and Variance',
    'Statistics - Hypothesis Testing',
    'Statistics - Bayesian Inference',
    'Physics - Electromagnetic Waves',
    'Physics - Signal Propagation',
    'Physics - Semiconductor Physics',
    'Economics - Supply and Demand',
    'Economics - Market Equilibrium',
    'Economics - Cost Optimization',
    'Psychology - Cognitive Bias',
    'Psychology - Decision Making',
    'Psychology - Human Attention',
    'Linguistics - Syntax',
    'Linguistics - Semantics',
    'Linguistics - Language Structure',
    'Biology - Neural Systems',
    'Biology - Evolution',
    'Biology - Biological Networks',
    'Finance - Risk Analysis',
    'Finance - Portfolio Optimization',
    'Finance - Market Prediction',
    'Management - Resource Allocation',
    'Management - Decision Making',
    'Management - Operations Planning',
    'System Design - Scalability',
    'System Design - Fault Tolerance',
    'System Design - Microservices',
    'Geography - Spatial Mapping',
    'Geography - Geographic Data Analysis',
    'Geography - Navigation Systems',
    'Communication Studies - Information Transmission',
    'Communication Studies - Communication Models',
    'Communication Studies - Media Influence',
    'Cognitive Science - Human Learning',
    'Cognitive Science - Pattern Recognition',
    'Cognitive Science - Memory Systems',
    'Social Sciences - Human Behavior',
    'Social Sciences - Social Networks',
    'Social Sciences - Collective Decision Making',
    'Molecular Biology - DNA Sequencing',
    'Molecular Biology - Gene Expression',
    'Molecular Biology - Protein Structure',
    'Signal Processing - Fourier Transform',
    'Signal Processing - Signal Filtering',
    'Signal Processing - Noise Reduction',
    'Digital Electronics - Flip Flops',
    'Digital Electronics - Logic Gates',
    'Digital Electronics - Finite State Machines',
    'Embedded Systems - Microcontrollers',
    'Embedded Systems - Real-Time Systems',
    'Embedded Systems - Sensor Interfaces',
    'Bioinformatics - Genome Analysis',
    'Bioinformatics - Sequence Alignment',
    'Bioinformatics - Protein Prediction',
    'Circuit Analysis - Ohm’s Law',
    'Circuit Analysis - Kirchhoff’s Laws',
    'Circuit Analysis - RLC Circuits'
];

export async function GET() {
    try {
        const supabase = await createClient()

        // 1. Create the T-Learn Round if it doesn't exist
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 7);

        let roundId;
        const { data: existingRound } = await supabase
            .from('rounds')
            .select('id')
            .eq('name', 'T-Learn Round')
            .single();

        if (existingRound) {
            roundId = existingRound.id;
        } else {
            const { data: newRound, error: roundErr } = await supabase
                .from('rounds')
                .insert([{
                    name: 'T-Learn Round',
                    description: 'Select two topics (one CSE, one Secondary) to study and submit an AI-assisted explanation.',
                    start_time: now.toISOString(),
                    end_time: future.toISOString(),
                    submission_type: ['tlearn_topics']
                }])
                .select()
                .single()

            if (roundErr) throw roundErr;
            roundId = newRound.id;
        }

        // 2. Clear out any previous topics for this round just in case
        await supabase.from('topics').delete().eq('round_id', roundId);

        // 3. Prepare Topic payloads
        const cseInserts = CSE_TOPICS.map(topic => ({
            round_id: roundId,
            category: 'cse',
            name: topic,
            max_teams: 3
        }));

        const otherInserts = OTHER_TOPICS.map(topic => ({
            round_id: roundId,
            category: 'other',
            name: topic,
            max_teams: 3
        }));

        const allInserts = [...cseInserts, ...otherInserts];

        // 4. Batch Insert
        const { error: insertErr } = await supabase
            .from('topics')
            .insert(allInserts);

        if (insertErr) throw insertErr;

        return NextResponse.json({ 
            success: true, 
            message: `Successfully seeded ${CSE_TOPICS.length} CSE topics and ${OTHER_TOPICS.length} Other topics to Round ${roundId}.` 
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
