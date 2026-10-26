// JalNyaya - DBMS Viva & Lab Assessment Helper Page
import React from 'react';
import { BookOpen, Database, Key, Layers, GitBranch, Zap, Shield, FileCheck } from 'lucide-react';

export default function VivaGuide() {
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
          DBMS Lab Viva & Assessment Reference Guide
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
          Quick-study guide explaining database concepts, normalization proofs, SQL architecture, and viva defenses
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Primary & Foreign Keys */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
            <Key size={20} />
            <h2 className="card-title" style={{ margin: 0, color: 'var(--primary)' }}>1. Primary & Foreign Keys</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><strong>Primary Key (PK):</strong> Every single table (all 13 tables) has an integer auto-increment PK ensuring row entity integrity (e.g. <code>users.user_id</code>, <code>streets.street_id</code>).</li>
            <li><strong>Foreign Key (FK):</strong> Enforces referential integrity. e.g. <code>deliveries.street_id REFERENCES streets(street_id)</code> prevents orphaned delivery records.</li>
            <li><strong>ON DELETE Policies:</strong> <code>CASCADE</code> used on child dependencies (households cascade when street deleted); <code>RESTRICT</code> used on core references (cannot delete role if assigned to active users).</li>
          </ul>
        </div>

        {/* Card 2: 3NF Normalization */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669' }}>
            <Layers size={20} />
            <h2 className="card-title" style={{ margin: 0, color: '#059669' }}>2. Normalization Proof (1NF, 2NF, 3NF)</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><strong>1NF (Atomicity):</strong> Every field stores atomic scalar values (no multivalued comma lists of phone numbers or tanker capacities).</li>
            <li><strong>2NF (No Partial Dependency):</strong> All non-key attributes depend on the entire primary key. No composite partial dependencies exist.</li>
            <li><strong>3NF (No Transitive Dependency):</strong> Transitive dependencies removed. e.g. We do NOT store <code>street_name</code>, <code>population</code> inside <code>deliveries</code>; we store only <code>street_id</code> as FK.</li>
          </ul>
        </div>

        {/* Card 3: Database Views */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0284c7' }}>
            <Database size={20} />
            <h2 className="card-title" style={{ margin: 0, color: '#0284c7' }}>3. Views & Analytical Novelty</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><code>street_fairness_view</code>: Computes litres delivered per capita and benchmarks against overall average using <code>RANK() OVER (ORDER BY litres_per_person ASC)</code>.</li>
            <li><code>delivery_priority_view</code>: Window function ranking urgency by waiting days, household count, and complaints.</li>
            <li><code>complaint_sla_view</code>: Evaluates 48-hour deadline and tags tickets as WITHIN SLA, DUE SOON, or BREACHED.</li>
            <li><code>operator_dispute_view</code>: Calculates driver dispute rate ratio percentage.</li>
          </ul>
        </div>

        {/* Card 4: Stored Procedures */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#d97706' }}>
            <Zap size={20} />
            <h2 className="card-title" style={{ margin: 0, color: '#d97706' }}>4. Stored Procedures & Triggers</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><strong>Stored Procedure:</strong> <code>calculate_street_fairness()</code> performs real database computation, recalculating system-wide average and updating priority scores on streets.</li>
            <li><strong>Trigger 1 (Delivery Dispute):</strong> <code>trg_delivery_dispute_insert</code> automatically changes delivery status to <code>DISPUTED</code> and inserts fraud alert when resident flags confirmed = FALSE.</li>
            <li><strong>Trigger 2 (Water Alert):</strong> <code>trg_water_level_reading_insert</code> keeps source current level in sync and raises LOW or CRITICAL alerts when depletion falls below 80% or 60%.</li>
          </ul>
        </div>

        {/* Card 5: Transactions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#7c3aed' }}>
            <GitBranch size={20} />
            <h2 className="card-title" style={{ margin: 0, color: '#7c3aed' }}>5. ACID Database Transactions</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><strong>Implementation:</strong> Delivery completion transaction in <code>deliveries.controller.js</code> using <code>prisma.$transaction</code>.</li>
            <li><strong>Step 1:</strong> Verify tanker status is not under MAINTENANCE or OUT_OF_SERVICE.</li>
            <li><strong>Step 2:</strong> Update delivery status to COMPLETED and record delivery_date.</li>
            <li><strong>Step 3:</strong> Atomically update street's <code>last_delivery_date</code> and reset tanker status.</li>
            <li><strong>ACID:</strong> If any validation or network step fails, all operations roll back completely.</li>
          </ul>
        </div>

        {/* Card 6: Authentication & Security */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#dc2626' }}>
            <Shield size={20} />
            <h2 className="card-title" style={{ margin: 0, color: '#dc2626' }}>6. Authentication, RBAC & Security</h2>
          </div>
          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li><strong>Single Users Table:</strong> Unified table with <code>role_id</code> foreign key distinguishes ADMIN, OPERATOR, and RESIDENT without duplicating schemas.</li>
            <li><strong>BCrypt:</strong> Secure password hashing with salt factor 10. Passwords never stored in plaintext.</li>
            <li><strong>JWT:</strong> Signed token carrying user role, verified by backend middleware on every request.</li>
            <li><strong>SQL Injection:</strong> Prevented using Prisma ORM parameterized queries.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
