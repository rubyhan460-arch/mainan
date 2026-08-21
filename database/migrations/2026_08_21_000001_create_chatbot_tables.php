<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Characters Table
        Schema::create('characters', function (Blueprint $table) {
            $table->string('id')->primary(); // slug e.g. 'ruby', 'akane'
            $table->string('name');
            $table->string('title')->nullable();
            $table->text('avatar_url')->nullable();
            $table->string('creator')->nullable()->default('@creator_dev');
            $table->json('tags')->nullable();
            $table->text('scenario')->nullable();
            $table->text('persona')->nullable();
            $table->text('greeting')->nullable();
            $table->json('greetings')->nullable();
            $table->boolean('allow_nsfw')->default(true);
            $table->boolean('bypass_guardrails')->default(true);
            $table->string('strictness')->default('uncensored');
            $table->text('visual_prompt')->nullable();
            $table->string('visual_lora')->nullable();
            $table->integer('default_affinity')->default(50);
            $table->timestamps();
        });

        // 2. Chat Histories Table
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('character_id')->index();
            $table->foreign('character_id')->references('id')->on('characters')->onDelete('cascade');
            $table->string('sender');
            $table->text('message');
            $table->timestamps();
        });

        // 3. Affinity Scores Table (Per User & Per Character)
        Schema::create('affinity_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('character_id')->index();
            $table->foreign('character_id')->references('id')->on('characters')->onDelete('cascade');
            $table->integer('score')->default(50);
            $table->timestamps();
            $table->unique(['user_id', 'character_id']);
        });

        // 4. Extracted User Facts Table (Per User)
        Schema::create('user_facts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('fact_key');
            $table->text('fact_value');
            $table->timestamps();
            $table->unique(['user_id', 'fact_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_facts');
        Schema::dropIfExists('affinity_scores');
        Schema::dropIfExists('chat_histories');
        Schema::dropIfExists('characters');
    }
};
