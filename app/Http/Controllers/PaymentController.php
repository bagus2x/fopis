<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
     public function index(Request $request): Response {
        return Inertia::render('payment');
     }
}
